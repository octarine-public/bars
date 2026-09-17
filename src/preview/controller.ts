import { BarLayout, GUIBars } from "../gui/bars"
import { HudCanvas } from "../gui/canvas"
import { BaseMenu } from "../menu/base"
import { MenuManager } from "../menu/index"
import { SampleUnit } from "./sample"

/** The game's own bar over an enemy hero, in design pixels. */
const heroBarWidth = 99
const heroBarHeight = 8

/** One row of the block on the stage - the health bar or the mana one - and where it stands this frame. */
export class PreviewRow {
	public Area: Nullable<HTMLElement>
	public Hovered = false

	private outline = "none"
	private outlineAccent = ""

	public readonly AreaRef = (element: HTMLElement | null | undefined): void => {
		this.Area = element ?? undefined
		if (this.Area === undefined) {
			this.Hovered = false
		}
	}

	constructor(
		public readonly Label: string,
		public readonly Menu: BaseMenu
	) {}

	/** Puts the pointer area over the row, in pixels of the stage, or takes it off the stage. */
	public Place(x: number, y: number, w: number, h: number, visible: boolean): void {
		const area = this.Area
		if (area === undefined) {
			return
		}
		MenuSDK.WriteShown(area, visible)
		if (!visible) {
			return
		}
		const pad = MenuSDK.DpToPx(3)
		MenuSDK.WritePx(area, "left", x - pad)
		MenuSDK.WritePx(area, "top", y - pad)
		MenuSDK.WritePx(area, "width", w + pad * 2)
		MenuSDK.WritePx(area, "height", h + pad * 2)
		const selected = MenuSDK.ElementSettingsNode() === this.Menu.Tree
		const lit = this.Hovered || selected
		MenuSDK.WriteStyle(area, "decorator", lit ? this.Outline() : "none")
	}

	/**
	 * The accent frame the row wears while it is pointed at. A decorator bakes its colour into a
	 * string, so it is built again only once the accent it was baked from has moved.
	 */
	private Outline(): string {
		const accent = MenuSDK.Theme.AccentHex
		if (accent !== this.outlineAccent) {
			this.outlineAccent = accent
			this.outline =
				MenuSDK.SdfShape(3, "#00000000", 1, MenuSDK.HexOf(MenuSDK.Tokens.Accent))
					.decorator ?? "none"
		}
		return this.outline
	}
}

/**
 * The bars over a sample hero on the page's preview, drawn by the code that draws them in the
 * world, so what the stage shows is what the game gets. Each row can be pointed at: a click
 * switches its number and a right click opens its settings beside the stage.
 */
export class PreviewController {
	public readonly Menu: MenuManager
	public readonly Frame: MenuSDK.ScreenRect = { x: 0, y: 0, w: 0, h: 0 }
	public readonly Canvas = new HudCanvas()
	public readonly Health: PreviewRow
	public readonly Mana: PreviewRow
	private readonly sample = new SampleUnit()
	private readonly bars: GUIBars
	private readonly position = new Vector2()
	private readonly size = new Vector2()

	constructor(menu: MenuManager) {
		this.Menu = menu
		this.bars = new GUIBars(this.Canvas)
		this.Health = new PreviewRow("Health", menu.Health)
		this.Mana = new PreviewRow("Mana", menu.Mana)
	}

	public IsShown(): boolean {
		return this.Menu.Node.IsActivePage
	}

	/** Where the stage landed on screen this frame, kept on the rectangle the settings open beside. */
	public Place(x: number, y: number, w: number, h: number): void {
		const frame = this.Frame
		frame.x = x
		frame.y = y
		frame.w = w
		frame.h = h
	}

	public Open(node: Menu.Node): void {
		if (MenuSDK.ElementSettingsNode() === node) {
			MenuSDK.CloseElementSettings()
		} else {
			MenuSDK.OpenElementSettings(node, this.Frame)
		}
	}

	/** Switches the row's number, the way its header switch does. */
	public Toggle(row: PreviewRow): void {
		const numbers = row.Menu.Numbers
		numbers.value = !numbers.value
		// only the stack the preview stands in has anything to redraw for this
		MenuSDK.RefreshPanelLayer(MenuSDK.EPanelLayer.Menu)
	}

	public Tick(visible: boolean, width: number, height: number): void {
		const pixel = GUIInfo.ScaleHeight(1)
		// the bar stands over the sample's head, in the game's own size while the stage holds it
		const barWidth = Math.min(
			Math.round(heroBarWidth * pixel),
			Math.round(width * 0.6)
		)
		const barHeight = Math.round(heroBarHeight * pixel)
		this.position.x = Math.round((width - barWidth) / 2)
		this.position.y = Math.round(height * 0.34)
		this.size.x = barWidth
		this.size.y = barHeight
		this.sample.Tick()
		let layout: Nullable<BarLayout>
		this.Canvas.Begin()
		if (visible && this.Menu.State.value) {
			this.bars.Update(this.position, this.size, undefined)
			layout = this.bars.Draw(this.Menu, this.sample)
		}
		this.Canvas.End()
		if (layout === undefined) {
			this.Health.Place(0, 0, 0, 0, false)
			this.Mana.Place(0, 0, 0, 0, false)
			return
		}
		// each area takes its row and the frame line around it
		const left = Math.round((layout.x - 1) * pixel)
		const rowWidth = Math.round((layout.width + 2) * pixel)
		this.Health.Place(
			left,
			Math.round((layout.y - 1) * pixel),
			rowWidth,
			Math.round((layout.height + 2) * pixel),
			true
		)
		this.Mana.Place(
			left,
			Math.round((layout.y + layout.height) * pixel),
			rowWidth,
			Math.round((layout.manaHeight + 2) * pixel),
			layout.manaHeight > 0
		)
	}
}
