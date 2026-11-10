import { ETextEffect } from "../enum"
import { LoadBarFonts } from "../fonts"

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
	readonly verticalAlign?: "top" | "center"
	/** What the glyphs stand on; nothing when omitted. */
	readonly effect?: ETextEffect
	/** The `#rrggbbaa` colour of the effect; opaque black when omitted. */
	readonly effectColor?: string
}

const defaultShade = "#000000ff"
const projected: [number, number] = [0, 0]

/** A pooled element, and the anchor slot it was last tied to. */
interface HudSlot {
	readonly element: HTMLElement
	anchor: number
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
	/** The root's document, read once a root: the getter crosses into the engine on every read. */
	private document: Nullable<HTMLElement["ownerDocument"]>
	private readonly shapes: HudSlot[] = []
	private readonly images: HudSlot[] = []
	private readonly texts: HudSlot[] = []
	private readonly typography: string[] = []
	private shapeCount = 0
	private imageCount = 0
	private textCount = 0
	private order = 0
	private boxWidth = 0
	private boxHeight = 0
	/** What a design pixel measures on this screen, read once for the frame every box lands in. */
	private pixel = 1
	/** The render anchor slot the block being drawn is tied to, -1 for none. */
	private anchorSlot = -1
	/** The whole screen pixel the block being drawn stands on: every box lands from it. */
	private anchorX = 0
	private anchorY = 0
	/** What the block keeps of the fraction the anchor was given, carried by a transform. */
	private shiftX = 0
	private shiftY = 0

	public readonly Ref = (element: HTMLElement | null | undefined): void => {
		for (const image of this.images) {
			MenuSDK.ReleaseSizedArt(image.element)
		}
		this.shapes.length = this.images.length = this.texts.length = 0
		this.typography.length = 0
		this.root = element ?? undefined
		this.document = undefined
		if (this.root !== undefined) {
			LoadBarFonts()
		}
	}

	public Begin(): void {
		this.shapeCount = this.imageCount = this.textCount = this.order = 0
		this.anchorX = this.anchorY = this.shiftX = this.shiftY = 0
		this.anchorSlot = -1
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
		this.anchorSlot = -1
		this.anchorX = Math.round(x)
		this.anchorY = Math.round(y)
		// hundredths, the way the world layer steps its own placement
		this.shiftX = exact ? Math.round((x - this.anchorX) * 100) / 100 : 0
		this.shiftY = exact ? Math.round((y - this.anchorY) * 100) / 100 : 0
	}

	/**
	 * Ties the block drawn next to `anchor`, `x, y` screen pixels from where it lands: the core
	 * places the boxes that follow when the frame is presented, so they keep up with the camera
	 * and the unit even on a frame whose script pass ran late. On a host without anchors the
	 * point is projected here instead. False, and nothing to draw, while the anchor is undefined
	 * or, projected here, off the screen.
	 */
	public AnchorTo(anchor: CRenderAnchor, x: number = 0, y: number = 0): boolean {
		if (anchor.Slot >= 0) {
			this.Anchor(x, y)
			this.anchorSlot = anchor.Slot
			return true
		}
		if (!anchor.Project(projected)) {
			return false
		}
		this.Anchor(projected[0] + x, projected[1] + y)
		return true
	}

	/** Ends the frame: whatever was not drawn again this frame goes off the screen. */
	public End(): void {
		this.hideUnused(this.shapes, this.shapeCount)
		this.hideUnused(this.images, this.imageCount)
		this.hideUnused(this.texts, this.textCount)
	}

	/** A flat quad in a `#rrggbb[aa]` colour. */
	public Rect(x: number, y: number, w: number, h: number, color: string): void {
		const element = this.shape(x, y, w, h)?.element
		if (element !== undefined) {
			MenuSDK.WriteStyle(element, "decorator", "none")
			MenuSDK.WriteStyle(element, "background-color", color)
		}
	}

	/** A quad painted by a decorator - a linear gradient - over nothing. */
	public Gradient(x: number, y: number, w: number, h: number, decorator: string): void {
		const element = this.shape(x, y, w, h)?.element
		if (element !== undefined) {
			MenuSDK.WriteStyle(element, "background-color", "#00000000")
			MenuSDK.WriteStyle(element, "decorator", decorator)
		}
	}

	/**
	 * Art cut straight to the whole-pixel box it stands in: the whole file, or the `region` of a
	 * sheet, multiplied by `tint` the way the game tints its sprites.
	 */
	public Image(
		x: number,
		y: number,
		w: number,
		h: number,
		path: string,
		region?: MenuSDK.ImageRegion,
		tint: string = "#ffffff"
	): void {
		if (path === "" || w <= 0 || h <= 0) {
			return
		}
		const slot = this.slot(this.images, this.imageCount++, "img")
		if (slot === undefined) {
			return
		}
		this.place(slot, x, y, w, h)
		const element = slot.element
		MenuSDK.WriteStyle(element, "image-color", tint)
		MenuSDK.WriteSizedArt(element, path, this.boxWidth, this.boxHeight, 0, region)
	}

	/**
	 * A run of text centred in its box, or with a font-sized line starting at the top edge.
	 * Horizontal alignment pins the edge without a measured width.
	 */
	public Text(x: number, y: number, w: number, h: number, style: HudTextStyle): void {
		if (style.text === "" || w <= 0 || h <= 0) {
			return
		}
		const index = this.textCount++
		const slot = this.slot(this.texts, index, "div")
		if (slot === undefined) {
			return
		}
		const element = slot.element
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
		this.place(slot, x, y, w, h)
		const fontSize = Math.round(style.size * this.pixel)
		MenuSDK.WritePx(element, "font-size", fontSize)
		MenuSDK.WritePx(
			element,
			"line-height",
			style.verticalAlign === "top" ? fontSize : this.boxHeight
		)
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

	private shape(x: number, y: number, w: number, h: number): Nullable<HudSlot> {
		if (w <= 0 || h <= 0) {
			return undefined
		}
		const slot = this.slot(this.shapes, this.shapeCount++, "div")
		if (slot !== undefined) {
			this.place(slot, x, y, w, h)
		}
		return slot
	}

	private slot(pool: HudSlot[], index: number, tag: string): Nullable<HudSlot> {
		const root = this.root
		if (root === undefined) {
			return undefined
		}
		const document = (this.document ??= root.ownerDocument ?? undefined)
		if (document === undefined) {
			return undefined
		}
		let slot = pool[index]
		if (slot === undefined) {
			const element = document.createElement(tag)
			MenuSDK.applyStyle(element, {
				position: "absolute",
				pointerEvents: "none"
			})
			MenuSDK.WriteStyle(element, "white-space", "nowrap")
			MenuSDK.WriteStyle(element, "overflow", "visible")
			root.appendChild(element)
			slot = { element, anchor: -1 }
			pool.push(slot)
		}
		return slot
	}

	/** Lands a design-pixel box on whole screen pixels from the anchor, one edge at a time, and stacks it last. */
	private place(slot: HudSlot, x: number, y: number, w: number, h: number): void {
		const element = slot.element
		if (slot.anchor !== this.anchorSlot) {
			slot.anchor = this.anchorSlot
			element.setAnchor(slot.anchor)
		}
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

	private hideUnused(pool: HudSlot[], used: number): void {
		for (let index = used; index < pool.length; index++) {
			MenuSDK.WriteShown(pool[index].element, false)
		}
	}
}
