import { Color, Menu } from "github.com/octarine-public/wrapper/index"

import { EManaMode } from "../enum"
import { BaseMenu } from "./base"

export class MenuMana extends BaseMenu {
	public readonly Mode: Menu.Dropdown
	public readonly InsideColor: Menu.ColorPicker
	public readonly fillColor: Menu.ColorPicker
	protected readonly arrNames = ["OFF", "Only MP", "MP/MaxMP"]

	constructor(node: Menu.Node) {
		super(node, "Mana")
		this.Mode = this.Tree.AddDropdown("Text", this.arrNames, EManaMode.OFF)
		this.InsideColor = this.Tree.AddColorPicker("Inside color", Color.Black)
		this.fillColor = this.Tree.AddColorPicker("Fill color", new Color(79, 120, 250))
	}

	public MenuChanged(callback: () => void) {
		super.MenuChanged(callback)
		this.Mode.OnValue(call => {
			this.TextColor.IsHidden = call.SelectedID === EManaMode.OFF
			callback()
		})
	}

	public ResetSettings(callback: () => void) {
		super.ResetSettings(callback)
		this.Mode.SelectedID = this.Mode.defaultValue
		this.InsideColor.SelectedColor.CopyFrom(this.InsideColor.defaultColor)
		this.fillColor.SelectedColor.CopyFrom(this.fillColor.defaultColor)
		callback()
	}
}
