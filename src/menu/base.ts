import { TextStyleMenu } from "./style"

export abstract class BaseMenu {
	public readonly Tree: Menu.Node
	/** The switch in the section's header: whether the bar carries its number. */
	public readonly Numbers: Menu.Toggle
	/** The bar's own text settings row; it follows the page's shared ones until overridden. */
	public readonly Style: TextStyleMenu

	constructor(
		node: Menu.Node,
		nodeName: string,
		iconPath: string,
		tooltip: string,
		style: TextStyleMenu
	) {
		this.Tree = node.AddNode(nodeName, iconPath, tooltip)
		this.Numbers = this.Tree.AddToggle(
			"Numbers",
			true,
			"Show the number over the bar.\nThe bar itself is drawn either way"
		)
		this.Tree.HeaderControl = this.Numbers
		// a settings row sorts below the bar's own rows, whatever order they are declared in
		this.Style = new TextStyleMenu(this.Tree, style)
	}

	/** The text settings the bar's reading is set in. */
	public get TextStyle(): TextStyleMenu {
		return this.Style.Effective
	}

	public MenuChanged(callback: () => void) {
		this.Numbers.OnValue(() => callback())
	}

	public ResetSettings(callback: () => void) {
		this.Numbers.value = this.Numbers.defaultValue
		callback()
	}
}
