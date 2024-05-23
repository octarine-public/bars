import {
	Color,
	Rectangle,
	RendererSDK,
	Unit
} from "github.com/octarine-public/wrapper/index"

import { EMode } from "../enum"
import { MenuMana } from "../menu/mana"
import { BaseGUI } from "./base"

export class GUIMana extends BaseGUI {
	public Draw(menu: MenuMana, owner: Unit): void {
		if (!this.State(menu, owner) || owner.MaxMana === 0) {
			return
		}

		const mode = menu.Mode.SelectedID,
			insideColor = menu.InsideColor.SelectedColor,
			fillColor = menu.fillColor.SelectedColor,
			textColor = menu.TextColor.SelectedColor

		this.position.AddY(this.position.Height)
		this.DrawBar(owner.ManaPercentDecimal, insideColor, fillColor)
		this.DrawText(mode, owner.Mana, owner.MaxMana, this.position, textColor)
	}

	protected DrawText(
		eMode: EMode,
		value: number,
		maxValue: number,
		position: Rectangle,
		textColor: Color
	): void {
		value >>= 0
		maxValue >>= 0

		let text = ""
		switch (eMode) {
			case EMode.CURRENT:
				text = `${value}`
				break
			case EMode.CURRENT_MAX:
				text = `${value}/${maxValue}`
				break
		}
		RendererSDK.TextByFlags(text, position, textColor)
	}
}
