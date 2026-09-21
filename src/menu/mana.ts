import { EMode } from "../enum"
import { BaseMenu } from "./base"
import { BarsIcons } from "./icons"
import { TextStyleMenu } from "./style"

export class MenuMana extends BaseMenu {
	public readonly Mode: Menu.Dropdown
	protected readonly arrNames = ["Only MP", "MP / MaxMP"]

	constructor(node: Menu.Node, style: TextStyleMenu) {
		super(
			node,
			"Mana",
			BarsIcons.Mana,
			"Mana bar right under the health one",
			style,
			false
		)
		this.Mode = this.Tree.AddDropdown(
			"Text",
			this.arrNames,
			EMode.CURRENT,
			"What the number over the mana bar reads"
		)
		this.Mode.IconPath = BarsIcons.Text
	}

	public MenuChanged(callback: () => void) {
		super.MenuChanged(callback)
	}

	public ResetSettings(callback: () => void) {
		super.ResetSettings(callback)
		this.Mode.SelectedID = this.Mode.defaultValue
		callback()
	}
}
