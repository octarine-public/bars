import {
	Color,
	GUIInfo,
	Rectangle,
	RendererSDK,
	Unit
} from "github.com/octarine-public/wrapper/index"

import { EMode } from "../enum"
import { MenuHealth } from "../menu/health"
import { BaseGUI } from "./base"

export class GUIHealth extends BaseGUI {
	public Draw(menu: MenuHealth, owner: Unit): void {
		if (!this.State(menu, owner) || owner.MaxHP === 0) {
			return
		}

		const mode = menu.Mode.SelectedID,
			textColor = menu.TextColor.SelectedColor

		const barFillColor = this.GetBarFillColor(owner)
		const barInsideColor = this.GetBarInsideColor(owner)

		this.DrawBar(owner.HPPercentDecimal, barInsideColor, barFillColor)
		this.DrawHealthText(mode, owner.HP, owner.MaxHP, this.position, textColor)

		if (this.IsFogVisible(owner) || this.HasVisibleBuffs(owner)) {
			this.DrawLevel(owner)
			this.DrawIconHero(owner)
		}
	}

	protected DrawHealthText(
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

	protected DrawIconHero(owner: Unit) {
		const base = this.position.Clone()
		const size = GUIInfo.ScaleVector(28, 28)
		const position = new Rectangle(base.pos1, base.pos1.Add(size))

		position.SubtractX(position.Width)
		position.SubtractY(position.Width / 4)

		const texturePath = owner.TexturePath(true)
		if (texturePath !== undefined) {
			RendererSDK.Image(texturePath, position.pos1, -1, position.Size)
		}
	}

	protected DrawLevel(owner: Unit) {
		const base = this.position.Clone()
		const size = GUIInfo.ScaleVector(20, 18)

		const position = new Rectangle(base.pos1, base.pos1.Add(size))
		position.AddX(base.Width + 1 / 2)
		position.SubtractY(position.Width / 8)

		RendererSDK.FilledRect(position.pos1, position.Size, new Color(93, 47, 46))
		RendererSDK.TextByFlags(owner.Level.toString(), position, Color.White, 1.3)
	}

	protected GetBarFillColor(owner: Unit) {
		const fillColor = new Color(209, 0, 24)
		return (!this.IsVisible(owner) && this.IsFogVisible(owner)) ||
			this.HasVisibleBuffs(owner)
			? fillColor
			: fillColor.SetA(0)
	}

	protected GetBarInsideColor(owner: Unit) {
		const inside = Color.Black
		return (!this.IsVisible(owner) && this.IsFogVisible(owner)) ||
			this.HasVisibleBuffs(owner)
			? inside
			: inside.SetA(0)
	}
}
