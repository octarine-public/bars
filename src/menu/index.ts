import {
	ImageData,
	Menu,
	NotificationsSDK,
	ResetSettingsUpdated,
	Sleeper
} from "github.com/octarine-public/wrapper/index"

import { MenuHealth } from "./health"
import { MenuMana } from "./mana"

export class MenuManager {
	public readonly State: Menu.Toggle

	public readonly Mana: MenuMana
	public readonly Health: MenuHealth

	private readonly tree: Menu.Node
	private readonly reset: Menu.Button
	private readonly baseNode = Menu.AddEntry("Visual")

	constructor(private readonly sleeper: Sleeper) {
		this.tree = this.baseNode.AddNode("Bars", ImageData.Paths.Icons.magic_resist)
		this.tree.SortNodes = false
		this.State = this.tree.AddToggle("State", true)
		this.Mana = new MenuMana(this.tree)
		this.Health = new MenuHealth(this.tree)
		this.reset = this.tree.AddButton("Reset settings", "Reset settings to default")
	}

	public MenuChanged(callback: () => void) {
		this.State.OnValue(() => callback())
		this.Mana.MenuChanged(callback)
		this.Health.MenuChanged(callback)
		this.reset.OnValue(() => this.ResetSettings(callback))
	}

	public ResetSettings(callback: () => void) {
		if (this.sleeper.Sleeping("ResetSettings")) {
			return
		}
		this.Mana.ResetSettings(callback)
		this.Health.ResetSettings(callback)
		this.State.value = this.State.defaultValue
		NotificationsSDK.Push(new ResetSettingsUpdated())
		this.sleeper.Sleep(2 * 1000, "ResetSettings")
	}
}
