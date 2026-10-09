import { EMode, ETextEffect } from "../enum"
import { LevelFont, LevelWeight } from "../fonts"
import { MenuHealth } from "../menu/health"
import { MenuManager } from "../menu/index"
import { MenuMana } from "../menu/mana"
import { HudCanvas } from "./canvas"
import {
	FrameInside,
	FrameInsideLeft,
	FrameInsideNoMana,
	FrameInsideRight,
	FrameRim,
	FrameRimNoMana,
	HealthBarSheet,
	HealthEmpty,
	HealthFull,
	IconBackingRegion,
	LevelBoxRegion,
	ManaFull,
	RowRight,
	SampledRow,
	SampleRow,
	SheetWidth,
	SpriteRows
} from "./sheet"
import { DrawReadout, ReadoutSize } from "./text"
import { BarUnit } from "./types"

type RGB = readonly [number, number, number]

/** The tints the game lays over an enemy's bar: dota_hud_new_healthbar_enemy_*, its health and its mana. */
const enemyBacking: RGB = [96, 48, 48]
const enemyHealth: RGB = [251, 63, 0]
const enemyMana: RGB = [81, 123, 255]
/** The top and bottom brightness of the level, dota_hud_new_healthbar_level_local_*_brightness, met halfway. */
const levelColor = "#cecece"
/** Dota Hypatia Bold, per em: the rise over the baseline the menu lays a line out by, and the one the game does. */
const levelRise = 0.734
const levelCellRise = 886 / 1151
const levelCellEm = 1000 / 1151
/** A divider every this many hit points, every fourth of them darker; lighter still past {@link highHealth}. */
const dividerHP = 250
const highHealth = 15000
const dividerAlpha = 96 / 255
const dividerMajorAlpha = 225 / 255
const highDividerAlpha = 0
const highDividerMajorAlpha = 128 / 255
/** The mana row the game draws, in design pixels: what a reading set small enough leaves it at. */
const manaRow = 4
/** A reading is set this much larger than the row it sits in, so its digits fill the row. */
const readoutRise = 3

function toLinear(channel: number): number {
	const c = channel / 255
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function toByte(linear: number): number {
	const c = Math.min(Math.max(linear, 0), 1)
	const encoded = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
	return Math.round(encoded * 255)
}

function hex(value: number): string {
	return value.toString(16).padStart(2, "0")
}

/** A tint over the sheet's grey, then laid over `under` (linear light) at `alpha`, the way the game blends. */
function blend(
	tint: RGB,
	grey: number,
	alpha: number,
	under: number[],
	out: number[]
): number[] {
	for (let i = 0; i < 3; i++) {
		out[i] = toLinear(tint[i] * grey) * alpha + under[i] * (1 - alpha)
	}
	return out
}

function css(linear: number[]): string {
	return `#${hex(toByte(linear[0]))}${hex(toByte(linear[1]))}${hex(toByte(linear[2]))}`
}

/** Black at `alpha` over anything, blended in linear light, as the overlay's own blending sees it. */
function shade(alpha: number): string {
	return `#000000${hex(Math.round((1 - (1 - alpha) ** (1 / 2.2)) * 255))}`
}

/** Pixel rows of one colour, merged as they are laid down. */
class RowRuns {
	private readonly colors: string[] = []
	private readonly tops: number[] = []
	private readonly bottoms: number[] = []

	public get Count(): number {
		return this.colors.length
	}

	public Clear(): void {
		this.colors.length = this.tops.length = this.bottoms.length = 0
	}

	public Add(y: number, color: string): void {
		const last = this.colors.length - 1
		if (last >= 0 && this.colors[last] === color && this.bottoms[last] === y) {
			this.bottoms[last] = y + 1
			return
		}
		this.colors.push(color)
		this.tops.push(y)
		this.bottoms.push(y + 1)
	}

	public Draw(surface: HudCanvas, pixel: number, left: number, right: number): void {
		if (right <= left) {
			return
		}
		for (let i = 0; i < this.colors.length; i++) {
			surface.Rect(
				left / pixel,
				this.tops[i] / pixel,
				(right - left) / pixel,
				(this.bottoms[i] - this.tops[i]) / pixel,
				this.colors[i]
			)
		}
	}
}

/** Where the rows landed on the last draw, in screen pixels: the health row, and the mana row under it. */
export interface BarLayout {
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
	/** The mana row's height, 0 while the unit has no mana. */
	readonly manaHeight: number
	readonly manaY: number
}

/**
 * The bar the game draws over a hero, part for part and pixel for pixel, on the layout the SDK
 * gives for it ({@link Unit.GetHeroHealthBar}): the level box, the frame and its rim, the empty and
 * full health rows with their dividers, the mana row, the icon backing and the icon. Rows are drawn
 * from the game's own sheet sampled the way the game samples it; the level box and the icon backing
 * are its sprites themselves. The mana row grows to hold its reading.
 */
export class GUIBars {
	private readonly layout = {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		manaHeight: 0,
		manaY: 0
	}
	private readonly rim = new RowRuns()
	private readonly inside = new RowRuns()
	private readonly empty = new RowRuns()
	private readonly full = new RowRuns()
	private readonly mana = new RowRuns()
	private readonly sample: SampledRow = { grey: 0, alpha: 0 }
	private readonly sampleUnder: SampledRow = { grey: 0, alpha: 0 }
	private readonly black = [0, 0, 0]
	private readonly mix = [0, 0, 0]
	private readonly mixUnder = [0, 0, 0]

	/** Draws on the surface given: the world's overlay, or the stage of the preview. */
	constructor(private readonly surface: HudCanvas) {}

	/**
	 * Draws the bar and says where its rows landed, or nothing when there was nothing to draw.
	 * With `readoutsOnly` the bar is left to the game and only the numbers are drawn, where they
	 * stand over a bar of ours, so a unit stepping out of the fog keeps them still.
	 */
	public Draw(
		menu: MenuManager,
		owner: BarUnit,
		bar: IHeroHealthBar,
		readoutsOnly: boolean = false
	): Nullable<BarLayout> {
		const health = owner.MaxHP !== 0
		const mana = owner.MaxMana !== 0
		if (!health && !mana) {
			return undefined
		}
		const healthNumbers = health && menu.Health.Numbers.value
		const manaNumbers = mana && menu.Mana.Numbers.value
		if (readoutsOnly && !healthNumbers && !manaNumbers) {
			return undefined
		}
		const pixel = GUIInfo.ScaleHeight(1)
		this.surface.Anchor(0, 0)
		const healthRow = bar.Health
		const manaRowRect = bar.Mana
		const healthSize = healthNumbers
			? ReadoutSize(menu.Health.TextStyle, healthRow.Height / pixel + readoutRise)
			: 0
		const manaSize = manaNumbers
			? ReadoutSize(menu.Mana.TextStyle, healthRow.Height / pixel + readoutRise)
			: 0
		const manaHeight = manaNumbers
			? Math.max(
					Math.round(Math.max(manaSize - readoutRise, manaRow) * pixel),
					manaRowRect.Height
				)
			: manaRowRect.Height
		const grow = mana ? manaHeight - manaRowRect.Height : 0
		if (!readoutsOnly) {
			const backing = this.backingTint(menu)
			if (owner.IsHero) {
				this.drawLevel(owner, bar, backing, pixel)
			}
			if (health) {
				this.drawFrame(bar, mana, grow, backing, pixel)
				this.drawHealth(owner, bar, backing, pixel)
			}
			if (mana) {
				this.drawMana(owner, bar, grow, pixel)
			}
			if (health) {
				this.drawDividers(owner, bar, pixel)
			}
			if (owner.IsHero) {
				this.drawIcon(owner, bar, backing, pixel)
			}
		}
		if (healthNumbers) {
			this.drawReadout(
				menu.Health,
				owner.HP,
				owner.MaxHP,
				healthRow.x / pixel,
				healthRow.y / pixel,
				healthRow.Width / pixel,
				healthRow.Height / pixel,
				healthSize
			)
		}
		if (manaNumbers) {
			this.drawReadout(
				menu.Mana,
				owner.Mana,
				owner.MaxMana,
				manaRowRect.x / pixel,
				manaRowRect.y / pixel,
				manaRowRect.Width / pixel,
				manaHeight / pixel,
				manaSize,
				"top"
			)
		}
		const layout = this.layout
		layout.x = healthRow.x
		layout.y = healthRow.y
		layout.width = healthRow.Width
		layout.height = healthRow.Height
		layout.manaY = manaRowRect.y
		layout.manaHeight = mana ? manaHeight : 0
		return layout
	}

	/** The tint over the frame: the game's own, or the colour the page paints it in. */
	private backingTint(menu: MenuManager): RGB {
		if (!menu.TintBacking.value) {
			return enemyBacking
		}
		const color = menu.BackingColor.SelectedColor
		return [color.r, color.g, color.b]
	}

	private drawLevel(
		owner: BarUnit,
		bar: IHeroHealthBar,
		tint: RGB,
		pixel: number
	): void {
		this.drawSprite(bar.LevelSprite, LevelBoxRegion, tint, pixel)
		const tall = bar.LevelFontTall
		const em = tall * levelCellEm
		const top = bar.LevelText.y + tall * levelCellRise - em * levelRise
		this.surface.Text(
			bar.LevelText.x / pixel,
			top / pixel,
			(em * 3) / pixel,
			em / pixel,
			{
				text: owner.Level.toString(),
				color: levelColor,
				size: em / pixel,
				family: LevelFont,
				weight: LevelWeight,
				align: "left",
				verticalAlign: "top",
				effect: ETextEffect.Outline
			}
		)
	}

	private drawIcon(
		owner: BarUnit,
		bar: IHeroHealthBar,
		tint: RGB,
		pixel: number
	): void {
		this.drawSprite(bar.IconSprite, IconBackingRegion, tint, pixel)
		const path = owner.TexturePath(true)
		const icon = bar.Icon
		if (path !== undefined) {
			this.surface.Image(
				icon.x / pixel,
				icon.y / pixel,
				icon.Width / pixel,
				icon.Height / pixel,
				path
			)
		}
	}

	private drawSprite(
		sprite: Rectangle,
		region: MenuSDK.ImageRegion,
		tint: RGB,
		pixel: number
	): void {
		const left = Math.round(sprite.x)
		const top = Math.round(sprite.y)
		this.surface.Image(
			left / pixel,
			top / pixel,
			(Math.round(sprite.pos2.x) - left) / pixel,
			(Math.round(sprite.pos2.y) - top) / pixel,
			HealthBarSheet,
			region,
			`#${hex(tint[0])}${hex(tint[1])}${hex(tint[2])}`
		)
	}

	private drawFrame(
		bar: IHeroHealthBar,
		hasMana: boolean,
		grow: number,
		tint: RGB,
		pixel: number
	): void {
		const sprite = bar.FrameSprite
		const rimColumn = hasMana ? FrameRim : FrameRimNoMana
		const insideColumn = hasMana ? FrameInside : FrameInsideNoMana
		const split = bar.Mana.pos2.y
		const rim = this.rim
		const inside = this.inside
		rim.Clear()
		inside.Clear()
		let lastRim = ""
		let lastInside = ""
		const [first, last] = SpriteRows(rimColumn, sprite.y, sprite.Height)
		for (let y = first; y <= last; y++) {
			if (y === split) {
				for (let extra = 0; extra < grow; extra++) {
					rim.Add(y + extra, lastRim)
					if (lastInside !== "") {
						inside.Add(y + extra, lastInside)
					}
				}
			}
			const shifted = y >= split ? y + grow : y
			const edge = SampleRow(rimColumn, sprite.y, sprite.Height, y, this.sample)
			if (edge.alpha <= 0) {
				continue
			}
			const rimColor = blend(tint, edge.grey, 1, this.black, this.mixUnder)
			lastRim =
				edge.alpha >= 1
					? css(rimColor)
					: `${css(rimColor)}${hex(Math.round(edge.alpha * 255))}`
			rim.Add(shifted, lastRim)
			const black = SampleRow(
				insideColumn,
				sprite.y,
				sprite.Height,
				y,
				this.sampleUnder
			)
			if (black.alpha > 0) {
				lastInside = css(blend([0, 0, 0], 0, black.alpha, rimColor, this.mix))
				inside.Add(shifted, lastInside)
			} else {
				lastInside = ""
			}
		}
		rim.Draw(this.surface, pixel, bar.Frame.x, bar.Frame.pos2.x)
		inside.Draw(
			this.surface,
			pixel,
			this.spriteColumn(sprite, FrameInsideLeft),
			this.spriteColumn(sprite, FrameInsideRight)
		)
	}

	private drawHealth(
		owner: BarUnit,
		bar: IHeroHealthBar,
		tint: RGB,
		pixel: number
	): void {
		const sprite = bar.HealthSprite
		const empty = this.empty
		const full = this.full
		empty.Clear()
		full.Clear()
		const [first, last] = SpriteRows(HealthFull, sprite.y, sprite.Height)
		for (let y = first; y <= last; y++) {
			const under = SampleRow(
				HealthEmpty,
				sprite.y,
				sprite.Height,
				y,
				this.sampleUnder
			)
			const over = SampleRow(HealthFull, sprite.y, sprite.Height, y, this.sample)
			const emptyColor = blend(
				tint,
				under.grey,
				under.alpha,
				this.black,
				this.mixUnder
			)
			if (under.alpha > 0) {
				empty.Add(y, css(emptyColor))
			}
			if (over.alpha > 0) {
				full.Add(
					y,
					css(blend(enemyHealth, over.grey, over.alpha, emptyColor, this.mix))
				)
			}
		}
		const row = bar.Health
		empty.Draw(this.surface, pixel, row.x, this.spriteColumn(sprite, RowRight))
		full.Draw(
			this.surface,
			pixel,
			row.x,
			row.x + bar.HealthFill(owner.HPPercentDecimal)
		)
	}

	private drawMana(
		owner: BarUnit,
		bar: IHeroHealthBar,
		grow: number,
		pixel: number
	): void {
		const sprite = bar.FrameSprite
		const mana = this.mana
		mana.Clear()
		const split = bar.Mana.pos2.y
		let lastColor = ""
		const [first, last] = SpriteRows(ManaFull, sprite.y, sprite.Height)
		for (let y = first; y <= last; y++) {
			if (y === split && lastColor !== "") {
				for (let extra = 0; extra < grow; extra++) {
					mana.Add(y + extra, lastColor)
				}
			}
			const row = SampleRow(ManaFull, sprite.y, sprite.Height, y, this.sample)
			if (row.alpha <= 0) {
				continue
			}
			lastColor = css(blend(enemyMana, row.grey, row.alpha, this.black, this.mix))
			mana.Add(y >= split ? y + grow : y, lastColor)
		}
		const rect = bar.Mana
		mana.Draw(
			this.surface,
			pixel,
			rect.x,
			rect.x + bar.ManaFill(owner.ManaPercentDecimal)
		)
	}

	private drawDividers(owner: BarUnit, bar: IHeroHealthBar, pixel: number): void {
		const hp = Math.trunc(owner.HP)
		if (hp <= dividerHP) {
			return
		}
		const high = owner.MaxHP >= highHealth
		const minor = shade(high ? highDividerAlpha : dividerAlpha)
		const major = shade(high ? highDividerMajorAlpha : dividerMajorAlpha)
		const count = Math.trunc(hp / dividerHP)
		for (let i = 1; i <= count; i++) {
			this.surface.Rect(
				bar.DividerX(i * dividerHP, owner.MaxHP) / pixel,
				bar.DividerTop / pixel,
				2 / pixel,
				bar.DividerHeight / pixel,
				i % 4 === 0 ? major : minor
			)
		}
	}

	/** The first pixel column of texel column `texel` of a 256-wide sprite stretched over `sprite`. */
	private spriteColumn(sprite: Rectangle, texel: number): number {
		return Math.ceil(sprite.x + (sprite.Width * texel) / SheetWidth - 0.5)
	}

	private drawReadout(
		menu: MenuHealth | MenuMana,
		value: number,
		maxValue: number,
		x: number,
		y: number,
		width: number,
		height: number,
		size: number,
		verticalAlign: "top" | "center" = "center"
	): void {
		value >>= 0
		maxValue >>= 0
		DrawReadout(
			this.surface,
			menu.TextStyle,
			menu.Mode.SelectedID === EMode.CURRENT_MAX
				? `${value} / ${maxValue}`
				: `${value}`,
			x,
			y,
			width,
			height,
			size,
			verticalAlign
		)
	}
}
