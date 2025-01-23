import { ImageData, Menu } from "github.com/octarine-public/wrapper/index"

import { MenuHealth } from "./health"
import { MenuMana } from "./mana"

export class MenuManager {
	public readonly State: Menu.Toggle

	public readonly Mana: MenuMana
	public readonly Health: MenuHealth

	private readonly tree: Menu.Node
	private readonly baseNode = Menu.AddEntry("Visual")

	constructor() {
		this.tree = this.baseNode.AddNode("Bars", ImageData.Icons.magic_resist)
		this.tree.SortNodes = false
		this.State = this.tree.AddToggle("State", true)
		this.Mana = new MenuMana(this.tree)
		this.Health = new MenuHealth(this.tree)
	}

	public MenuChanged(callback: () => void) {
		this.State.OnValue(() => callback())
		this.Mana.MenuChanged(callback)
		this.Health.MenuChanged(callback)
	}
}
