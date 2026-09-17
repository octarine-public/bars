/**
 * What the bars read off the unit they stand over. A unit in the world answers it as itself;
 * the preview's sample answers the same questions with numbers of its own.
 */
export interface BarUnit {
	readonly IsHero: boolean
	readonly Level: number
	readonly HP: number
	readonly MaxHP: number
	readonly HPPercentDecimal: number
	readonly Mana: number
	readonly MaxMana: number
	readonly ManaPercentDecimal: number
	TexturePath(small?: boolean): Nullable<string>
}
