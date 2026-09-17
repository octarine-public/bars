import { EMode } from "../enum"
import { BaseMenu } from "./base"
import { BarsIcons } from "./icons"
import { TextStyleMenu } from "./style"

export class MenuHealth extends BaseMenu {
	public readonly Mode: Menu.Dropdown
	private readonly arrNames = ["Only HP", "HP / MaxHP"]

	constructor(node: Menu.Node, style: TextStyleMenu) {
		super(
			node,
			"Health",
			BarsIcons.Health,
			"Health bar over the unit, drawn the way the game\ndraws its own, with the hero's icon and level beside it",
			style
		)
		this.Mode = this.Tree.AddDropdown(
			"Text",
			this.arrNames,
			EMode.CURRENT_MAX,
			"What the number over the health bar reads"
		)
		this.Mode.IconPath = BarsIcons.Text
	}

	public MenuChanged(callback: () => void) {
		super.MenuChanged(callback)
		this.Mode.OnValue(() => callback())
	}

	public ResetSettings(callback: () => void) {
		super.ResetSettings(callback)
		this.Mode.SelectedID = this.Mode.defaultValue
	}
}
