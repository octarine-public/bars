import { Color, ImageData, Menu } from "github.com/octarine-public/wrapper/index"

export abstract class BaseMenu {
	public readonly Tree: Menu.Node
	public readonly State: Menu.Toggle
	public readonly TextColor: Menu.ColorPicker

	constructor(node: Menu.Node, nodeName: string, defaultState = true) {
		this.Tree = node.AddNode(nodeName, ImageData.Icons.icon_svg_hamburger)
		this.State = this.Tree.AddToggle("State", defaultState)
		this.TextColor = this.Tree.AddColorPicker("Text color", Color.White)
		this.TextColor.IsHidden = true
	}

	public MenuChanged(callback: () => void) {
		this.State.OnValue(() => callback())
		this.TextColor.OnValue(() => callback())
	}

	public ResetSettings(callback: () => void) {
		this.State.value = this.State.defaultValue
		this.TextColor.SelectedColor.CopyFrom(this.TextColor.defaultColor)
		callback()
	}
}
