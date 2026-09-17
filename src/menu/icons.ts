const iconsPath = `${__OCT_PACKAGE_ROOT__}/scripts_files/bars/icons`

/**
 * The drawings offered for the page's own icon. One of them rides
 * {@link BarsIcons.UnitBars}; the rest wait their turn.
 */
export const PageIcons = {
	/** Two progress bars, the health one over the mana one. */
	Stacked: `${iconsPath}/bars-stacked.svg`,
	/** A heart with a pulse line through it. */
	HeartPulse: `${iconsPath}/heart-pulse.svg`,
	/** A bar standing over the head and shoulders of a unit. */
	OverUnit: `${iconsPath}/bar-over-unit.svg`,
	/** A heart beside a drop of mana. */
	HeartMana: `${iconsPath}/heart-mana.svg`,
	/** A dial reading a value off a scale. */
	Gauge: `${iconsPath}/gauge.svg`
} as const

/** Icons of the unit bars menu: the page, its sections and the rows inside. */
export const BarsIcons = {
	UnitBars: PageIcons.Stacked,
	// sections
	Health: Menu.Icons.Heart,
	Mana: `${iconsPath}/mana.svg`,
	Style: Menu.Icons.Type,
	/** The sample the preview stands its bars over, while it has no model. */
	Hero: `${iconsPath}/hero.svg`,
	// rows
	State: Menu.Icons.Power,
	/** The row saying which enemies the numbers stand over. */
	Visibility: Menu.Icons.EyeOff,
	Text: Menu.Icons.Type,
	TextSize: Menu.Icons.TextSize,
	TextColor: Menu.Icons.Baseline,
	TextEffect: Menu.Icons.TextDots,
	Palette: Menu.Icons.Palette,
	Opacity: Menu.Icons.Checkerboard,
	FillColor: `${iconsPath}/bar-fill.svg`,
	InsideColor: `${iconsPath}/bar-track.svg`
} as const
