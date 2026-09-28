import { ETextEffect } from "../enum"
import { ReadoutGapFontFamily } from "../fonts"
import { TextStyleMenu } from "../menu/style"
import { HudCanvas } from "./canvas"

/** The size a reading is set at, in design pixels: its base scaled by the settings' text size. */
export function ReadoutSize(style: TextStyleMenu, base: number): number {
	return Math.max(Math.round((base * style.Size.value) / 100), 1)
}

/** A stretch of a reading set in one face. */
interface ReadoutRun {
	readonly text: string
	readonly family: string
}

/**
 * The reading cut into the stretches each face sets: all of it in the settings' face, or - where
 * that face gives the rest of the reading over to another - its digits in it and the rest apart.
 */
function readoutRuns(text: string, family: string): ReadoutRun[] {
	const gapFamily = ReadoutGapFontFamily(family)
	if (gapFamily === undefined || !/\D/.test(text)) {
		return [{ text, family }]
	}
	const runs: ReadoutRun[] = []
	for (const part of text.split(/(\D+)/)) {
		if (part === "") {
			continue
		}
		// RmlUi drops the space a run opens with; a no-break one it keeps, and measures alike
		runs.push(
			/\d/.test(part)
				? { text: part, family }
				: { text: part.replace(/ /g, " "), family: gapFamily }
		)
	}
	return runs
}

/**
 * The screen width of every run at a size, with every digit as the widest one so the widths
 * hold still while the numbers tick; nothing where a face could not measure its run.
 */
function measureRuns(
	runs: ReadoutRun[],
	sizePx: number,
	weight: number
): Nullable<number[]> {
	const widths: number[] = []
	for (const run of runs) {
		const measured = MenuSDK.MeasureTextPx(
			run.text.replace(/\d/g, "0"),
			sizePx,
			weight,
			run.family
		)
		if (measured === undefined) {
			return undefined
		}
		widths.push(measured[0])
	}
	return widths
}

function sum(values: number[]): number {
	let total = 0
	for (const value of values) {
		total += value
	}
	return total
}

/**
 * A reading in the settings' face, colour and effect, laid out inside a box on the surface. A
 * run wider than the box is set smaller until it fits, measured with every digit as the widest
 * one so the size holds still while the numbers tick, the way the cooldowns strips fit theirs.
 * Where the face gives what is not a digit over to another, the stretches are set side by side,
 * centred in the box together.
 */
export function DrawReadout(
	surface: HudCanvas,
	style: TextStyleMenu,
	text: string,
	x: number,
	y: number,
	w: number,
	h: number,
	size: number,
	verticalAlign: "top" | "center" = "center"
): void {
	if (text === "" || w <= 0 || h <= 0 || size <= 0) {
		return
	}
	const family = style.FontFamily
	const weight = style.FontWeight
	const pixel = GUIInfo.ScaleHeight(1)
	const left = Math.round(x * pixel)
	const boxWidth = Math.round((x + w) * pixel) - left
	const sizePx = Math.round(size * pixel)
	const runs = readoutRuns(text, family)
	let widths = measureRuns(runs, sizePx, weight)
	let fittedPx = sizePx
	if (widths !== undefined && sum(widths) > boxWidth) {
		fittedPx = Math.max(Math.floor((sizePx * boxWidth) / sum(widths)), 1)
		widths = runs.length > 1 ? measureRuns(runs, fittedPx, weight) : widths
	}
	const color = style.Color.SelectedColor
	// the engine's alpha is a whole 0-255, and a percentage rarely lands on one
	const shade = Math.round((style.EffectOpacity.value * 255) / 100)
	const look = {
		color: MenuSDK.CssColor(color, 255),
		opacity: color.a / 255,
		size: fittedPx / pixel,
		weight,
		verticalAlign,
		effect: shade > 0 ? style.Effect.SelectedID : ETextEffect.None,
		effectColor: MenuSDK.CssColor(style.EffectColor.SelectedColor, shade)
	}
	if (runs.length === 1 || widths === undefined) {
		surface.Text(x, y, w, h, { ...look, text, family })
		return
	}
	// whole screen pixels from the box's own edge, so the runs meet without a seam or overlap
	let runLeft = left + Math.round((boxWidth - sum(widths)) / 2)
	for (let index = 0; index < runs.length; index++) {
		const run = runs[index]
		const width = Math.max(Math.round(widths[index]), 1)
		surface.Text(runLeft / pixel, y, width / pixel, h, {
			...look,
			text: run.text,
			family: run.family,
			align: "left"
		})
		runLeft += width
	}
}
