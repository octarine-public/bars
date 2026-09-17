import { EMode } from "../enum"
import { BaseMenu } from "./base"
import { BarsIcons } from "./icons"
import { TextStyleMenu } from "./style"

export class MenuMana extends BaseMenu {
	public readonly Mode: Menu.Dropdown
	public readonly InsideColor: Menu.ColorPicker
	public readonly fillColor: Menu.ColorPicker
	protected readonly arrNames = ["Only MP", "MP / MaxMP"]

	constructor(node: Menu.Node, style: TextStyleMenu) {
		super(node, "Mana", BarsIcons.Mana, "Mana bar right under the health one", style)
		this.Mode = this.Tree.AddDropdown(
			"Text",
			this.arrNames,
			EMode.CURRENT,
			"What the number over the mana bar reads"
		)
		this.Mode.IconPath = BarsIcons.Text
		this.InsideColor = this.Tree.AddColorPicker(
			"Inside color",
			Color.Black,
			"Color of the empty part of the mana bar"
		)
		this.InsideColor.IconPath = BarsIcons.InsideColor
		this.fillColor = this.Tree.AddColorPicker(
			"Fill color",
			new Color(79, 120, 250),
			"Color of the filled part of the mana bar"
		)
		this.fillColor.IconPath = BarsIcons.FillColor
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
