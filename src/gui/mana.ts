import { canvas } from "../../render"
import { EMode } from "../enum"
import { MenuMana } from "../menu/mana"
import { BaseGUI } from "./base"

export class GUIMana extends BaseGUI {
	public Draw(menu: MenuMana, owner: Unit, isEnded: boolean = false): void {
		this.DrawData(menu, owner, isEnded ? this.positionEnd : this.position, isEnded)
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
		canvas.TextIn(text, position, {
			color: textColor,
			size: position.Height / 1.2 + 4
		})
	}
	protected DrawData(
		menu: MenuMana,
		owner: Unit,
		position: Rectangle,
		isEnded: boolean = false
	) {
		if (owner.MaxMana === 0 || !position.pos1.IsValid) {
			return
		}
		if (!this.State(menu, owner, isEnded)) {
			return
		}
		const mode = menu.Mode.SelectedID,
			insideColor = menu.InsideColor.SelectedColor,
			fillColor = menu.fillColor.SelectedColor,
			textColor = menu.TextColor.SelectedColor

		const borderTop = GUIInfo.ScaleHeight(1)
		position.AddY(position.Height + borderTop)
		this.DrawBar(owner.ManaPercentDecimal, insideColor, fillColor, position)
		canvas.Rect(position.pos1, position.Size, {
			color: Color.fromUint32(0),
			borderColor: Color.Black,
			borderWidth: 2
		})
		this.DrawText(mode, owner.Mana, owner.MaxMana, position, textColor)
	}
}
