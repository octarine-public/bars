import { EShowNumbers } from "../enum"
import { MenuHealth } from "./health"
import { BarsIcons } from "./icons"
import { MenuMana } from "./mana"
import { TextStyleMenu } from "./style"

export class MenuManager {
	public readonly State: Menu.Toggle
	/** Which enemies the numbers stand over. The bars themselves go where the game hides its own. */
	public readonly ShowNumbers: Menu.Dropdown
	/** Whether the backing under a bar of ours wears {@link BackingColor} rather than the game's own. */
	public readonly TintBacking: Menu.Toggle
	public readonly BackingColor: Menu.ColorPicker

	/** The text settings every bar follows until it overrides them. */
	public readonly Style: TextStyleMenu
	public readonly Mana: MenuMana
	public readonly Health: MenuHealth

	private readonly tree: Menu.Node
	private readonly baseNode = Menu.AddEntry("Visual")

	constructor() {
		// the page went by "Bars", the name the top panel files its own bars page under:
		// one dictionary serves every script, so the two cannot share a name
		this.migrateName(this.baseNode.entry.stored)
		MenuSDK.AddConfigMigration(raw =>
			this.migrateName(MenuSDK.ConfigSubtreeOf(raw, this.baseNode.entry))
		)

		this.tree = this.baseNode.AddNode(
			"Unit bars",
			BarsIcons.UnitBars,
			"Health and mana bars over enemy units,\nshown where the game hides its own: in the fog or mid-teleport"
		)

		// the script's own switch rides the top bar beside the breadcrumb and gates the page
		this.State = this.tree.AddToggle("State", true)
		this.State.IconPath = BarsIcons.State
		this.tree.HeaderControl = this.State
		this.tree.Gate = this.State

		this.ShowNumbers = this.tree.AddDropdown(
			"Show numbers",
			["When hidden", "Always"],
			EShowNumbers.HIDDEN_ONLY,
			"When the numbers stand over an enemy: only while the game hides\nits own bar, or over every one of them. Over an enemy the game\nkeeps its bar on, the numbers are added without a bar of ours"
		)
		this.ShowNumbers.IconPath = BarsIcons.Visibility
		this.ShowNumbers.Priority = 0

		this.TintBacking = this.tree.AddToggle(
			"Tint backing",
			false,
			"Paint the backing under the bars in a colour of your own,\nso a bar drawn over an enemy in the fog reads apart\nfrom the ones the game draws itself"
		)
		this.TintBacking.IconPath = BarsIcons.Backing
		this.BackingColor = this.tree
			.AddColorPicker("Backing color", new Color(40, 56, 120))
			.NoGradient()
		this.TintBacking.PairColors(this.BackingColor)
		this.TintBacking.Priority = 1

		// the bars ride the shared style, so it is declared first and listed last
		this.Style = new TextStyleMenu(this.tree)
		this.Health = new MenuHealth(this.tree, this.Style)
		this.Mana = new MenuMana(this.tree, this.Style)
		const sections = [this.Health.Tree, this.Mana.Tree, this.Style.Node]
		sections.forEach((section, index) => (section.Priority = index + 2))
	}

	/** Whether the numbers also stand over an enemy the game keeps its own bar on. */
	public get NumbersOverVisible(): boolean {
		return (
			this.ShowNumbers.SelectedID === EShowNumbers.ALL_ENEMIES &&
			(this.Health.Numbers.value || this.Mana.Numbers.value)
		)
	}

	/** The page itself, for a panel that belongs on screen only while the page is. */
	public get Node(): Menu.Node {
		return this.tree
	}

	public MenuChanged(callback: () => void) {
		this.State.OnValue(() => callback())
		this.ShowNumbers.OnValue(() => callback())
		this.TintBacking.OnValue(() => callback())
		this.BackingColor.OnValue(() => callback())
		this.Mana.MenuChanged(callback)
		this.Health.MenuChanged(callback)
	}

	/**
	 * Carries the page saved under its old name over to the one it wears now. Idempotent, as a
	 * migration must be: a config already holding the new name passes through untouched.
	 */
	private migrateName(stored: Nullable<MenuSDK.ConfigObject>) {
		MenuSDK.RenameStoredRow(stored, "Bars", "Unit bars")
	}
}
