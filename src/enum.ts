export const enum EMode {
	CURRENT,
	CURRENT_MAX
}

/** Which enemies carry the numbers, in the order the "Show numbers" dropdown offers. */
export const enum EShowNumbers {
	/** Only where the game hides its own bar: the block under the numbers is ours as well. */
	HIDDEN_ONLY,
	/** Every enemy: over one the game keeps its own bar on, the numbers are added alone. */
	ALL_ENEMIES
}

/** What the glyphs of a reading stand on, in the order the "Under text" dropdown offers. */
export const enum ETextEffect {
	None,
	Shadow,
	Outline,
	SoftShadow
}
