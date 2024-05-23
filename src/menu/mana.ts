import { Color, Menu } from "github.com/octarine-public/wrapper/index"

import { EMode } from "../enum"
import { BaseMenu } from "./base"

export class MenuMana extends BaseMenu {
	public readonly Mode: Menu.Dropdown
	public readonly InsideColor: Menu.ColorPicker
	public readonly fillColor: Menu.ColorPicker
	protected readonly arrNames = ["Only MP", "MP/MaxMP"]

	constructor(node: Menu.Node) {
		super(node, "Mana", false)
		this.Mode = this.Tree.AddDropdown("Text", this.arrNames, EMode.CURRENT)
		this.InsideColor = this.Tree.AddColorPicker("Inside color", Color.Black)
		this.fillColor = this.Tree.AddColorPicker("Fill color", new Color(79, 120, 250))
	}

	public MenuChanged(callback: () => void) {
		super.MenuChanged(callback)
	}

	public ResetSettings(callback: () => void) {
		super.ResetSettings(callback)
		this.Mode.SelectedID = this.Mode.defaultValue
		this.InsideColor.SelectedColor.CopyFrom(this.InsideColor.defaultColor)
		this.fillColor.SelectedColor.CopyFrom(this.fillColor.defaultColor)
		callback()
	}
}
