import { ETextEffect } from "../enum"

/** How a run of text on the surface is set. The size is in design pixels, like every box. */
export interface HudTextStyle {
	readonly text: string
	/** A `#rrggbb[aa]` colour. */
	readonly color: string
	/** How strongly the run is drawn, 0 to 1; fully opaque when omitted. */
	readonly opacity?: number
	readonly size: number
	/** The face the run is set in; the menu theme's own when omitted. */
	readonly family?: string
	readonly weight?: number
	readonly align?: "left" | "center" | "right"
	/** What the glyphs stand on; nothing when omitted. */
	readonly effect?: ETextEffect
	/** The `#rrggbbaa` colour of the effect; opaque black when omitted. */
	readonly effectColor?: string
}

const defaultShade = "#000000ff"

/** Dota's resource/clientscheme.res: UnitInfoPlayerLevelFont. Carries the digits only. */
const levelFontPath = `${__OCT_PACKAGE_ROOT__}/scripts_files/bars/fonts/dotahypatiasansprobold.ttf`
let levelFontLoaded = false

/** Loads the level face once for every surface: the world's and the preview's share it. */
function loadLevelFont(): void {
	if (!levelFontLoaded && typeof LoadFont === "function") {
		levelFontLoaded = LoadFont(levelFontPath, false, 800)
	}
}

/**
 * The one overlay every bar is drawn on. Backing, frame, fills, readouts and icons are pooled
 * elements of the script's own, placed the way the cooldowns preview places the parts of its
 * health bar: in 1080p design pixels scaled by the screen, from the whole pixel the block is
 * anchored on, each edge rounded on its own so two parts sharing an edge land on the same
 * screen pixel. A fill is a quad, a gradient a decorator,
 * an icon art minted for its box - nothing is resampled a second time on the way to the screen.
 */
export class HudCanvas {
	private root: Nullable<HTMLElement>
	private readonly shapes: HTMLElement[] = []
	private readonly images: HTMLElement[] = []
	private readonly texts: HTMLElement[] = []
	private readonly typography: string[] = []
	private shapeCount = 0
	private imageCount = 0
	private textCount = 0
	private order = 0
	private boxWidth = 0
	private boxHeight = 0
	/** What a design pixel measures on this screen, read once for the frame every box lands in. */
	private pixel = 1
	/** The whole screen pixel the block being drawn stands on: every box lands from it. */
	private anchorX = 0
	private anchorY = 0
	/** What the block keeps of the fraction the anchor was given, carried by a transform. */
	private shiftX = 0
	private shiftY = 0

	public readonly Ref = (element: HTMLElement | null | undefined): void => {
		for (const image of this.images) {
			MenuSDK.ReleaseSizedArt(image)
		}
		this.shapes.length = this.images.length = this.texts.length = 0
		this.typography.length = 0
		this.root = element ?? undefined
		if (this.root !== undefined) {
			loadLevelFont()
		}
	}

	public Begin(): void {
		this.shapeCount = this.imageCount = this.textCount = this.order = 0
		this.anchorX = this.anchorY = this.shiftX = this.shiftY = 0
		this.pixel = GUIInfo.ScaleHeight(1)
	}

	/**
	 * Stands the block drawn next on a whole screen pixel: the boxes that follow are laid out in
	 * design pixels from it. A box rounded from where the camera left the bar comes out a pixel
	 * wider on one frame than the next, and a run centred in it jumps by half of that; a box
	 * measured from a whole pixel is the same width on every frame, wherever the camera is.
	 *
	 * With `exact` the fraction is kept as well and carried by a transform over every box, the
	 * way the world layer carries its shapes: a block that stands on something the game draws
	 * at a fraction of a pixel, like its own bar, would otherwise sit a pixel off it from one
	 * place on the screen to the next.
	 */
	public Anchor(x: number, y: number, exact: boolean = false): void {
		this.anchorX = Math.round(x)
		this.anchorY = Math.round(y)
		// hundredths, the way the world layer steps its own placement
		this.shiftX = exact ? Math.round((x - this.anchorX) * 100) / 100 : 0
		this.shiftY = exact ? Math.round((y - this.anchorY) * 100) / 100 : 0
	}

	/** Ends the frame: whatever was not drawn again this frame goes off the screen. */
	public End(): void {
		this.hideUnused(this.shapes, this.shapeCount)
		this.hideUnused(this.images, this.imageCount)
		this.hideUnused(this.texts, this.textCount)
	}

	/** A flat quad in a `#rrggbb[aa]` colour. */
	public Rect(x: number, y: number, w: number, h: number, color: string): void {
		const element = this.shape(x, y, w, h)
		if (element !== undefined) {
			MenuSDK.WriteStyle(element, "decorator", "none")
			MenuSDK.WriteStyle(element, "background-color", color)
		}
	}

	/** A quad painted by a decorator - a linear gradient - over nothing. */
	public Gradient(x: number, y: number, w: number, h: number, decorator: string): void {
		const element = this.shape(x, y, w, h)
		if (element !== undefined) {
			MenuSDK.WriteStyle(element, "background-color", "#00000000")
			MenuSDK.WriteStyle(element, "decorator", decorator)
		}
	}

	/** Art cut straight to the whole-pixel box it stands in. */
	public Image(x: number, y: number, w: number, h: number, path: string): void {
		if (path === "" || w <= 0 || h <= 0) {
			return
		}
		const element = this.slot(this.images, this.imageCount++, "img")
		if (element === undefined) {
			return
		}
		this.place(element, x, y, w, h)
		MenuSDK.WriteSizedArt(element, path, this.boxWidth, this.boxHeight)
	}

	/**
	 * A run of text laid out inside a box rather than at a corner: a line height equal to the box
	 * centres the glyphs exactly, and the alignment pins the edge without a measured width.
	 */
	public Text(x: number, y: number, w: number, h: number, style: HudTextStyle): void {
		if (style.text === "" || w <= 0 || h <= 0) {
			return
		}
		const index = this.textCount++
		const element = this.slot(this.texts, index, "div")
		if (element === undefined) {
			return
		}
		const family = style.family ?? MenuSDK.Theme.FontFamily
		const weight = MenuSDK.MenuFontWeight(style.weight ?? 700)
		const shade = style.effectColor ?? defaultShade
		// A rim and a hard shadow are glyph effects baked into the face; a soft shadow is a
		// filter over the run, which costs the font atlas nothing and needs no reshaping.
		const effect =
			style.effect === ETextEffect.Outline
				? `outline(1px ${shade})`
				: style.effect === ETextEffect.Shadow
					? `shadow(1px 1px ${shade})`
					: "none"
		const filter =
			style.effect === ETextEffect.SoftShadow
				? `drop-shadow(${shade} 1px 1px 2px)`
				: "none"
		const typography = `${family}:${weight}:${effect}`
		this.place(element, x, y, w, h)
		MenuSDK.WritePx(element, "font-size", Math.round(style.size * this.pixel))
		MenuSDK.WritePx(element, "line-height", this.boxHeight)
		MenuSDK.WriteStyle(element, "font-family", family)
		MenuSDK.WriteFmt(element, "font-weight", weight, "")
		MenuSDK.WriteStyle(element, "font-effect", effect)
		MenuSDK.WriteStyle(element, "filter", filter)
		MenuSDK.WriteStyle(element, "color", style.color)
		MenuSDK.WriteFmt(element, "opacity", style.opacity ?? 1, "")
		MenuSDK.WriteStyle(element, "text-align", style.align ?? "center")
		// A run set in another face is emptied first, so RmlUi shapes it afresh instead of
		// keeping the glyphs it already holds for the string.
		if (this.typography[index] !== typography) {
			this.typography[index] = typography
			MenuSDK.WriteText(element, "")
		}
		MenuSDK.WriteText(element, style.text)
	}

	private shape(x: number, y: number, w: number, h: number): Nullable<HTMLElement> {
		if (w <= 0 || h <= 0) {
			return undefined
		}
		const element = this.slot(this.shapes, this.shapeCount++, "div")
		if (element !== undefined) {
			this.place(element, x, y, w, h)
		}
		return element
	}

	private slot(pool: HTMLElement[], index: number, tag: string): Nullable<HTMLElement> {
		const root = this.root
		if (root?.ownerDocument === undefined) {
			return undefined
		}
		let element = pool[index]
		if (element === undefined) {
			element = root.ownerDocument.createElement(tag)
			MenuSDK.applyStyle(element, { position: "absolute", pointerEvents: "none" })
			MenuSDK.WriteStyle(element, "white-space", "nowrap")
			MenuSDK.WriteStyle(element, "overflow", "visible")
			root.appendChild(element)
			pool.push(element)
		}
		return element
	}

	/** Lands a design-pixel box on whole screen pixels from the anchor, one edge at a time, and stacks it last. */
	private place(
		element: HTMLElement,
		x: number,
		y: number,
		w: number,
		h: number
	): void {
		const pixel = this.pixel
		const left = Math.round(x * pixel)
		const top = Math.round(y * pixel)
		this.boxWidth = Math.round((x + w) * pixel) - left
		this.boxHeight = Math.round((y + h) * pixel) - top
		MenuSDK.WritePx(element, "left", this.anchorX + left)
		MenuSDK.WritePx(element, "top", this.anchorY + top)
		MenuSDK.WritePlacement(element, this.shiftX, this.shiftY, 0)
		MenuSDK.WritePx(element, "width", this.boxWidth)
		MenuSDK.WritePx(element, "height", this.boxHeight)
		MenuSDK.WriteFmt(element, "z-index", this.order++, "")
		MenuSDK.WriteShown(element, true)
	}

	private hideUnused(pool: HTMLElement[], used: number): void {
		for (let index = used; index < pool.length; index++) {
			MenuSDK.WriteShown(pool[index], false)
		}
	}
}
