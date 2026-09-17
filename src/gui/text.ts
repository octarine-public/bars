import { ETextEffect } from "../enum"
import { TextStyleMenu } from "../menu/style"
import { HudCanvas } from "./canvas"

/** The size a reading is set at, in design pixels: its base scaled by the settings' text size. */
export function ReadoutSize(style: TextStyleMenu, base: number): number {
	return Math.max(Math.round((base * style.Size.value) / 100), 1)
}

/**
 * A reading in the settings' face, colour and effect, laid out inside a box on the surface. A
 * run wider than the box is set smaller until it fits, measured with every digit as the widest
 * one so the size holds still while the numbers tick, the way the cooldowns strips fit theirs.
 */
export function DrawReadout(
	surface: HudCanvas,
	style: TextStyleMenu,
	text: string,
	x: number,
	y: number,
	w: number,
	h: number,
	size: number
): void {
	if (text === "" || w <= 0 || h <= 0 || size <= 0) {
		return
	}
	const family = style.FontFamily
	const weight = style.FontWeight
	const pixel = GUIInfo.ScaleHeight(1)
	const boxWidth = Math.round((x + w) * pixel) - Math.round(x * pixel)
	const sizePx = Math.round(size * pixel)
	const measured = MenuSDK.MeasureTextPx(
		text.replace(/\d/g, "0"),
		sizePx,
		weight,
		family
	)
	const fitted =
		measured !== undefined && measured[0] > boxWidth
			? Math.max(Math.floor((sizePx * boxWidth) / measured[0]), 1) / pixel
			: size
	const color = style.Color.SelectedColor
	// the engine's alpha is a whole 0-255, and a percentage rarely lands on one
	const shade = Math.round((style.EffectOpacity.value * 255) / 100)
	surface.Text(x, y, w, h, {
		text,
		color: MenuSDK.CssColor(color, 255),
		opacity: color.a / 255,
		size: fitted,
		family,
		weight,
		effect: shade > 0 ? style.Effect.SelectedID : ETextEffect.None,
		effectColor: MenuSDK.CssColor(style.EffectColor.SelectedColor, shade)
	})
}
