import {
	Color,
	modifierstate,
	Rectangle,
	RendererSDK,
	Unit,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { BaseMenu } from "../menu/base"

export abstract class BaseGUI {
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

	protected IsUntargetable(unit: Unit): boolean {
		return unit.IsUnitStateFlagSet(modifierstate.MODIFIER_STATE_UNTARGETABLE)
	}

	protected IsFogVisible(unit: Unit): boolean {
		return unit.IsFogVisible
	}

	protected IsToss(unit: Unit): boolean {
		return unit.HasBuffByName("modifier_tiny_toss")
	}

	protected State(menu: BaseMenu, owner: Unit) {
		return !(
			!menu.State.value &&
			this.IsVisible(owner) &&
			(!this.IsFogVisible(owner) ||
				!this.IsToss(owner) ||
				!this.IsUntargetable(owner))
		)
	}
}
