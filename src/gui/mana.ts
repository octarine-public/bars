import {
	Color,
	npc_dota_hero_medusa,
	Rectangle,
	RendererSDK,
	Unit
} from "github.com/octarine-public/wrapper/index"

import { EManaMode } from "../enum"
import { MenuMana } from "../menu/mana"
import { BaseGUI } from "./base"

export class GUIMana extends BaseGUI {
	public Draw(menu: MenuMana, owner: Unit): void {
		if (!menu.State.value) {
			return
		}
		const mode = menu.Mode.SelectedID,
			insideColor = menu.InsideColor.SelectedColor,
			fillColor = menu.fillColor.SelectedColor,
			textColor = menu.TextColor.SelectedColor
		this.setPosition(owner, menu.Mode.SelectedID)
		this.DrawBar(owner.ManaPercentDecimal, insideColor, fillColor)
		this.DrawText(mode, owner.Mana, owner.MaxMana, this.position, textColor)
	}

	protected DrawText(
		eMode: EManaMode,
		value: number,
		maxValue: number,
		position: Rectangle,
		textColor: Color
	): void {
		if (eMode === EManaMode.OFF) {
			return
		}

		value >>= 0
		maxValue >>= 0

		let text = ""
		switch (eMode) {
			case EManaMode.CURRENT:
				text = `${value}`
				break
			case EManaMode.CURRENT_MAX:
				text = `${value}/${maxValue}`
				break
		}
		RendererSDK.TextByFlags(text, position, textColor)
	}

	private setPosition(owner: Unit, eMode: EManaMode): void {
		if (eMode !== EManaMode.OFF) {
			this.addY(owner instanceof npc_dota_hero_medusa ? 11 : 8)
			return
		}
		if (!(owner instanceof npc_dota_hero_medusa)) {
			this.position.Height /= 4
			this.addY(8)
			return
		}
		this.position.Height /= 3
		this.addY(11)
	}

	private addY(divide: number) {
		this.position.AddY((this.position.Width - this.position.Height) / divide)
	}
}
