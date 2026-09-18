import { EMode, ETextEffect } from "../enum"
import { MenuHealth } from "../menu/health"
import { MenuManager } from "../menu/index"
import { MenuMana } from "../menu/mana"
import { BaseGUI } from "./base"
import { HudCanvas } from "./canvas"
import { DrawReadout, ReadoutSize } from "./text"
import { BarUnit } from "./types"

/** Dota's resource/clientscheme.res: UnitInfoPlayerLevelFont, the face the level box is set in. */
const levelFont = "Dota Hypatia Bold"
const levelWeight = 800
/** The size the level is set at, in design pixels: the game's 13 reads small next to its own, 15 matches it. */
const levelSize = 15
const levelColor = "#e8e6e3"
/**
 * Dota Hypatia Bold, per em: how far the face rises over its baseline and falls under it, and
 * how far up the hinted digits reach, standing on the baseline. A line centres the rise-plus-fall
 * block, so the digits, which fill only the top of it, sit above the middle.
 */
const levelRise = 0.734
const levelFall = 0.266
const levelDigitHeight = 2 / 3
/**
 * The box the level sits in, right of the frame, in design pixels: as wide as the game's own,
 * so two digits stand centred in it with the game's room on either side.
 */
const levelBox = 28
const backing = "#381A19"
const frameColor = "#000000"
const divider = "#35120750"
const manaShade = "#00000080"
/** An enemy's health, top to bottom. */
const healthFill = "linear-gradient(to bottom, #BE3308, #B22A00)"
/** The backing darkens towards the frame on either side, under the icon and the level. */
const edgeFade = "linear-gradient(to right, #00000000, #00000050 50%, #00000000)"
/** The health bar carries a divider every this many hit points, the way the game's own does. */
const segmentHP = 250
/** The game's own mana row: what the row is without a reading, or under one set small enough. */
const manaRow = 4
/**
 * A reading is set this much larger than the row it sits in: the digits' cap height then fills
 * the row, the way the game's own health reading fills its bar.
 */
const readoutRise = 3

/**
 * How far the level box drops, in whole screen pixels, to stand its digits in the middle of it:
 * half of what the line leaves under them. Read off the pixels the face is set on rather than off
 * the em, because the renderer rounds the rise up and the fall down to whole pixels before it lays
 * the line out, and that rounding is worth a pixel of its own at the size the box is set at.
 */
function levelDrop(sizePx: number): number {
	const rise = Math.ceil(levelRise * sizePx)
	const fall = Math.ceil(levelFall * sizePx)
	const digits = Math.round(levelDigitHeight * sizePx)
	return (fall - rise + digits) / 2
}

/** Where the block landed on the last draw, in design pixels: the health row, and the mana row under it. */
export interface BarLayout {
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
	/** The mana row's height, 0 while the unit has no mana. It stands 1px under the health row. */
	readonly manaHeight: number
}

/**
 * The block the game draws over a unit, part for part: the backing, the frame, the health fill
 * with its dividers, the mana row under it, and for a hero the level box on the right and the
 * icon on the left. Laid out in 1080p design pixels, as the cooldowns preview lays out its
 * reference bar, on the rectangle the game keeps its own bar in. The health row is the game's;
 * the mana row grows to hold its reading.
 */
export class GUIBars extends BaseGUI {
	private readonly layout = { x: 0, y: 0, width: 0, height: 0, manaHeight: 0 }

	/** Draws on the surface given: the world's overlay, or the stage of the preview. */
	constructor(private readonly surface: HudCanvas) {
		super()
	}

	/**
	 * Draws the block and says where it landed, or nothing when there was nothing to draw.
	 * With `readoutsOnly` the block is left to the game and only the numbers are drawn, in the
	 * places they take over a block of ours, so a unit stepping out of the fog keeps them still.
	 */
	public Draw(
		menu: MenuManager,
		owner: BarUnit,
		isEnded: boolean = false,
		readoutsOnly: boolean = false
	): Nullable<BarLayout> {
		const bar = isEnded ? this.positionEnd : this.position
		if (!bar.pos1.IsValid) {
			return undefined
		}
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
		const hero = owner.IsHero
		const pixel = GUIInfo.ScaleHeight(1)
		// The block stands on the whole screen pixel nearest the bar, and its parts are laid
		// out from there: rounded from the bar itself, each part would land a pixel off from
		// one frame to the next as the camera moved, and the readouts with them. Readouts over
		// the game's own bar keep the fraction instead: the game draws its bar at one, and
		// numbers on whole pixels would stand a pixel off it here and on it there.
		const anchorX = Math.round(bar.x)
		const anchorY = Math.round(bar.y)
		this.surface.Anchor(bar.x, bar.y, readoutsOnly)
		const x = 0
		const y = 0
		const width = bar.Width / pixel
		const height = bar.Height / pixel
		const healthSize = healthNumbers
			? ReadoutSize(menu.Health.TextStyle, height + readoutRise)
			: 0
		const manaSize = manaNumbers
			? ReadoutSize(menu.Mana.TextStyle, height + readoutRise)
			: 0
		// the mana row grows to hold its reading; without one it is the game's own
		const manaHeight = manaNumbers
			? Math.max(manaSize - readoutRise, manaRow)
			: manaRow
		if (!readoutsOnly) {
			// 1px black above HP, 1px between the bars and 2px below the mana row. Without a
			// mana bar the frame closes 1px below HP, the way it does over a unit that has no mana.
			const frame = height + (mana ? manaHeight + 4 : 2)
			if (health) {
				this.drawFrame(x, y, width, frame, hero)
				this.drawHealth(owner, x, y, width, height)
			}
			if (mana) {
				this.drawMana(menu.Mana, owner, x, y + height + 1, width, manaHeight)
			}
			if (health && hero) {
				this.drawLevel(owner, x + width + 1, y - 1, frame)
				this.drawIcon(owner, x - 28, y - 6)
			}
		}
		if (healthNumbers) {
			this.drawReadout(
				menu.Health,
				owner.HP,
				owner.MaxHP,
				x,
				y,
				width,
				height,
				healthSize
			)
		}
		if (manaNumbers) {
			this.drawReadout(
				menu.Mana,
				owner.Mana,
				owner.MaxMana,
				x,
				y + height + 1,
				width,
				manaHeight,
				manaSize
			)
		}
		const layout = this.layout
		layout.x = anchorX / pixel
		layout.y = anchorY / pixel
		layout.width = width
		layout.height = height
		layout.manaHeight = mana ? manaHeight : 0
		return layout
	}

	private drawFrame(
		x: number,
		y: number,
		width: number,
		frame: number,
		hero: boolean
	): void {
		const surface = this.surface
		// Backing starts halfway under the icon and runs out under the level box:
		// 2px above and 1px below the frame.
		surface.Rect(
			x - (hero ? 16 : 2),
			y - 3,
			width + (hero ? 17 + levelBox : 4),
			frame + 3,
			backing
		)
		if (hero) {
			const fadeWidth = 1 + 17 / 2
			surface.Gradient(x - 1 - fadeWidth, y - 3, fadeWidth * 2, frame + 3, edgeFade)
			surface.Gradient(
				x + width + 1 - fadeWidth,
				y - 3,
				fadeWidth * 2,
				frame + 3,
				edgeFade
			)
		}
		surface.Rect(x - 1, y - 1, width + 2, frame, frameColor)
	}

	private drawHealth(
		owner: BarUnit,
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		const fill = Math.max(Math.round(width * owner.HPPercentDecimal), 1)
		this.surface.Gradient(x, y, fill, height, healthFill)
		for (let hp = segmentHP; hp < owner.MaxHP; hp += segmentHP) {
			this.surface.Rect(
				x + Math.round((width * hp) / owner.MaxHP),
				y,
				2,
				height,
				divider
			)
		}
	}

	private drawMana(
		menu: MenuMana,
		owner: BarUnit,
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		const surface = this.surface
		surface.Rect(
			x,
			y,
			width,
			height,
			MenuSDK.CssColor(menu.InsideColor.SelectedColor)
		)
		surface.Rect(
			x,
			y,
			Math.round(width * owner.ManaPercentDecimal),
			height,
			MenuSDK.CssColor(menu.fillColor.SelectedColor)
		)
		// Shade the first mana row over its flat fill, keeping the separator above it.
		surface.Rect(x, y, width, 1, manaShade)
	}

	private drawLevel(owner: BarUnit, x: number, y: number, height: number): void {
		const pixel = GUIInfo.ScaleHeight(1)
		const drop = levelDrop(Math.round(levelSize * pixel)) / pixel
		this.surface.Text(x, y + drop, levelBox, height, {
			text: owner.Level.toString(),
			color: levelColor,
			size: levelSize,
			family: levelFont,
			weight: levelWeight,
			effect: ETextEffect.Outline
		})
	}

	private drawIcon(owner: BarUnit, x: number, y: number): void {
		const path = owner.TexturePath(true)
		if (path !== undefined) {
			this.surface.Image(x, y, 26, 26, path)
		}
	}

	private drawReadout(
		menu: MenuHealth | MenuMana,
		value: number,
		maxValue: number,
		x: number,
		y: number,
		width: number,
		height: number,
		size: number
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
			size
		)
	}
}
