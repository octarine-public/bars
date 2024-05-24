import {
	Color,
	Rectangle,
	RendererSDK,
	Unit,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { BaseMenu } from "../menu/base"

export abstract class BaseGUI {
	protected static readonly visibleBuffs = [
		"modifier_tiny_toss",
		"modifier_eul_cyclone",
		"modifier_wind_waker",
		"modifier_monkey_king_transform",
		"modifier_phantom_assassin_blur_active",
		"modifier_dark_willow_shadow_realm_buff"
	]

	protected readonly position = new Rectangle()

	public abstract Draw(menu: BaseMenu, owner: Unit): void

	public Update(position: Vector2, size: Vector2): void {
		this.position.pos1.CopyFrom(position)
		this.position.pos2.CopyFrom(position.Add(size))
	}

	protected DrawBar(decimal: number, insideColor: Color, fillColor: Color): void {
		RendererSDK.FilledRect(this.position.pos1, this.position.Size, insideColor)
		const dPosition = this.position.Clone()
		const minSizeX = 1 / (this.position.Width * 2)
		const size = dPosition.Size.MultiplyScalarX(Math.max(decimal, minSizeX))
		RendererSDK.FilledRect(dPosition.pos1, size, fillColor)
	}

	protected IsVisible(unit: Unit): boolean {
		return unit.IsVisible
	}

	protected IsFogVisible(owner: Unit): boolean {
		return owner.IsFogVisible
	}

	protected HasVisibleBuffs(owner: Unit): boolean {
		return owner.HasAnyBuffByNames(BaseGUI.visibleBuffs)
	}

	protected State(menu: BaseMenu, owner: Unit) {
		if (this.IsFogVisible(owner) || this.HasVisibleBuffs(owner)) {
			return true
		}
		if (menu.State.value) {
			return this.IsVisible(owner)
		}
		return false
	}
}
