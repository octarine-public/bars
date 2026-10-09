/**
 * The health bar sheet the game draws its bars from (CDOTAHealthBars), and what the bars here need
 * of it: where the level box and icon sprites sit in it, and, for the frame and the rows, their
 * grey down the middle column, texel row by texel row. The game tints the grey and stretches the
 * 256×128 sprite over the bar, sampling it bilinearly, so the pixel rows it lands are these rows
 * sampled the same way.
 */
export const HealthBarSheet = "materials/vgui/hud/health_sheet/healthbar_sheet.vtex_c"

export const LevelBoxRegion = { x: 1072, y: 944, width: 128, height: 128 }
export const IconBackingRegion = { x: 1296, y: 944, width: 128, height: 128 }

export const SheetHeight = 128
export const SheetWidth = 256
/** The texel column the health and mana rows end at, one past their last. */
export const RowRight = 250

/** A run of texel rows down a sprite: the first row's index, then grey and alpha, 0-255, per row. */
export interface SpriteColumn {
	readonly first: number
	readonly grey: readonly number[]
	readonly alpha: readonly number[]
}

function column(first: number, rows: [grey: number, alpha: number][]): SpriteColumn {
	return {
		first,
		grey: rows.map(row => row[0]),
		alpha: rows.map(row => row[1])
	}
}

function repeat(row: [number, number], count: number): [number, number][] {
	return Array.from({ length: count }, () => row)
}

/** tintable_hero_bg: the rim, its grey carried across the black middle. */
export const FrameRim = column(52, [
	[8, 0],
	[231, 255],
	...repeat([156, 255], 42),
	[123, 255],
	[0, 0]
])
/** tintable_hero_bg: how much of the black middle stands over the rim, row by row. */
export const FrameInside = column(56, [[0, 0], ...repeat([0, 255], 36), [0, 0]])
export const FrameInsideLeft = 4
export const FrameInsideRight = 252

/** tintable_hero_bg_nomana, the frame of a unit without mana. */
export const FrameRimNoMana = column(52, [
	[0, 0],
	[165, 239],
	[165, 255],
	[165, 255],
	[156, 255],
	...repeat([161, 255], 24),
	[156, 255],
	[156, 255],
	[156, 255],
	[123, 239],
	[0, 0]
])
export const FrameInsideNoMana = column(56, [[0, 0], ...repeat([0, 255], 24), [0, 0]])

/** tintable_hero_full */
export const HealthFull = column(58, [
	[239, 0],
	[239, 255],
	[239, 255],
	[230, 255],
	[222, 255],
	[214, 255],
	[208, 255],
	[203, 255],
	[198, 255],
	[198, 255],
	[195, 255],
	[192, 255],
	[189, 255],
	[189, 255],
	[183, 255],
	[183, 255],
	[183, 255],
	[173, 255],
	[173, 255],
	[164, 0]
])
/** tintable_hero_empty, under the health row and tinted like the frame. */
export const HealthEmpty = column(58, [
	[30, 0],
	[33, 255],
	[33, 255],
	[33, 255],
	[33, 255],
	[33, 255],
	[35, 255],
	[35, 255],
	[35, 255],
	[38, 255],
	[41, 255],
	[43, 255],
	[43, 255],
	[46, 255],
	[49, 255],
	[49, 255],
	[49, 255],
	[49, 255],
	[49, 255],
	[0, 0]
])
/** tintable_hero_manafull */
export const ManaFull = column(80, [
	[41, 0],
	[247, 255],
	[247, 255],
	[247, 255],
	[249, 255],
	[249, 255],
	[249, 255],
	[249, 255],
	[247, 255],
	[247, 0]
])

/** One pixel row a sprite column lands on: its grey and alpha, 0-1. */
export interface SampledRow {
	grey: number
	alpha: number
}

/**
 * What a sprite column stretched from `top` over `height` pixels paints on pixel row `y`: its two
 * nearest texel rows blended by distance, the way the game's sampler blends them.
 */
export function SampleRow(
	sprite: SpriteColumn,
	top: number,
	height: number,
	y: number,
	out: SampledRow
): SampledRow {
	const texel = ((y + 0.5 - top) * SheetHeight) / height - 0.5
	const index = Math.floor(texel)
	const weight = texel - index
	const at = index - sprite.first
	const greyA = sprite.grey[at] ?? 0
	const greyB = sprite.grey[at + 1] ?? 0
	const alphaA = sprite.alpha[at] ?? 0
	const alphaB = sprite.alpha[at + 1] ?? 0
	out.grey = (greyA + (greyB - greyA) * weight) / 255
	out.alpha = (alphaA + (alphaB - alphaA) * weight) / 255
	return out
}

/** The pixel rows a sprite column can reach when stretched from `top` over `height`. */
export function SpriteRows(
	sprite: SpriteColumn,
	top: number,
	height: number
): [first: number, last: number] {
	const scale = height / SheetHeight
	return [
		Math.floor(top + sprite.first * scale) - 1,
		Math.ceil(top + (sprite.first + sprite.grey.length) * scale) + 1
	]
}
