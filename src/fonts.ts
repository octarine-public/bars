/**
 * The faces the bars are drawn in, and the one place they are loaded: the world's overlay and
 * the preview's stage share them, and a face that would not load leaves what it carries to the
 * menu's own.
 */

/** Dota's resource/clientscheme.res: UnitInfoPlayerLevelFont, the face the level box is set in. */
export const LevelFont = "Dota Hypatia Bold"
export const LevelWeight = 800
/** That face carries the digits only, so it ships with the script rather than the game's install. */
const levelFile = `${__OCT_PACKAGE_ROOT__}/scripts_files/bars/fonts/dotahypatiasansprobold.ttf`

let levelLoaded = false

/**
 * A face of the game's own, taken from its install rather than shipped again, with one cut per
 * weight the settings offer: "Weight" keeps its say over the face, and Medium, which neither
 * family has a cut for, is drawn in the nearest one.
 */
class GameFace {
	private cuts = 0

	constructor(
		public readonly Family: string,
		private readonly files: [path: string, weight: number][]
	) {}

	/** Whether the install gave this face; {@link Load} asks it for one. */
	public get Available(): boolean {
		return this.cuts > 0
	}

	/** Asks the install for every cut that has not taken yet. */
	public Load(): void {
		if (this.cuts >= this.files.length || typeof LoadFont !== "function") {
			return
		}
		let cuts = 0
		for (const [path, weight] of this.files) {
			if (LoadFont(path, false, weight)) {
				cuts++
			}
		}
		this.cuts = cuts
	}
}

/**
 * `font-family: monospaceNumbersFont` in the game, the face it sets its own readings in: ten
 * digits all of one width, and a space as wide again. The numbers on the bars are set in it
 * until the settings name another, so a reading holds still as it ticks instead of shuffling
 * sideways under the digits it lands on.
 *
 * It carries those eleven glyphs and nothing else, so the slash of an `HP / MaxHP` reading comes
 * from the menu's own fallback - a Roboto slash at regular weight, whichever weight the reading
 * asks for. {@link fullFace} carries the whole alphabet and is offered beside it.
 */
const monoFace = new GameFace("RadianceM", [
	["panorama/fonts/radiancem-regular.otf", 400],
	["panorama/fonts/radiancem-semibold.otf", 600],
	["panorama/fonts/radiancem-bold.otf", 700]
])

/** The face the game sets the rest of its HUD in: the same design, its digits cut to fit. */
const fullFace = new GameFace("Radiance", [
	["panorama/fonts/radiance-regular.otf", 400],
	["panorama/fonts/radiance-semibold.otf", 600],
	["panorama/fonts/radiance-bold.otf", 700]
])

/** Loads every face once for a surface; a cut that did not take is asked for again with the next. */
export function LoadBarFonts(): void {
	if (!levelLoaded && typeof LoadFont === "function") {
		levelLoaded = LoadFont(levelFile, false, LevelWeight)
	}
	monoFace.Load()
	fullFace.Load()
}

/**
 * The face a reading is set in while the settings name none: the game's numeric face, the rest
 * of its HUD where the install had no cut of that one, and the menu's own where it had neither.
 */
export function ReadoutFontFamily(): string {
	if (monoFace.Available) {
		return monoFace.Family
	}
	return fullFace.Available ? fullFace.Family : MenuSDK.Theme.FontFamily
}

/**
 * The faces the "Font" row offers: the ones the menu ships, and the game's own after them where
 * the install gave them — last, so a face picked before it was on offer is still the face the
 * row reads afterwards. The row is built once, so the install is asked here rather than waited on.
 */
export function ReadoutFontFamilies(): string[] {
	LoadBarFonts()
	const families = MenuSDK.MenuFontFamilies()
	if (fullFace.Available && !families.includes(fullFace.Family)) {
		families.push(fullFace.Family)
	}
	if (monoFace.Available && !families.includes(monoFace.Family)) {
		families.push(monoFace.Family)
	}
	return families
}
