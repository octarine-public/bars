import { Menu } from "github.com/octarine-public/wrapper/index"

import { EHealthMode } from "../enum"
import { BaseMenu } from "./base"

export class MenuHealth extends BaseMenu {
	public readonly Mode: Menu.Dropdown
	private readonly arrNames = ["Only HP", "HP/MaxHP"]

	constructor(node: Menu.Node) {
		super(node, "Health", false)
		this.Mode = this.Tree.AddDropdown("Text", this.arrNames, EHealthMode.CURRENT_MAX)
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
