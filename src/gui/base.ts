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
	protected readonly positionEnd = new Rectangle()

	public abstract Draw(menu: BaseMenu, owner: Unit): void

	public Update(
		position: Nullable<Vector2>,
		size: Vector2,
		positionEnd: Nullable<Vector2>
	): void {
		if (position === undefined) {
			this.position.pos1.Invalidate()
			this.position.pos2.Invalidate()
		} else {
			this.position.pos1.CopyFrom(position)
			this.position.pos2.CopyFrom(position.Add(size))
		}
		if (positionEnd === undefined) {
			this.positionEnd.pos1.Invalidate()
			this.positionEnd.pos2.Invalidate()
		} else {
			this.positionEnd.pos1.CopyFrom(positionEnd)
			this.positionEnd.pos2.CopyFrom(positionEnd.Add(size))
		}
	}

	protected DrawBar(
		decimal: number,
		insideColor: Color,
		fillColor: Color,
		position: Rectangle
	): void {
		RendererSDK.FilledRect(position.pos1, position.Size, insideColor)
		const dPosition = position.Clone()
		const minSizeX = 1 / position.Width
		const size = dPosition.Size.MultiplyScalarX(Math.max(decimal, minSizeX))
		RendererSDK.FilledRect(dPosition.pos1, size, fillColor)
	}
	protected IsTeleported(unit: Unit): boolean {
		return unit.TPStartPosition.IsValid && unit.TPEndPosition.IsValid
	}
	protected IsVisible(unit: Unit): boolean {
		return unit.IsVisible
	}
	protected IsFogVisible(owner: Unit): boolean {
		return !this.IsVisible(owner) && (owner.IsFogVisible || this.IsTeleported(owner))
	}
	protected HasVisibleBuffs(owner: Unit): boolean {
		return this.IsVisible(owner) && owner.HasAnyBuffByNames(BaseGUI.visibleBuffs)
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
