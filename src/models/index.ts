import {
	GetPositionHeight,
	GUIInfo,
	RendererSDK,
	Unit,
	Vector2,
	Vector3
} from "github.com/octarine-public/wrapper/index"

import { GUIHealth } from "../gui/health"
import { GUIMana } from "../gui/mana"
import { MenuManager } from "../menu/index"

export class UnitData {
	protected readonly GUIMana = new GUIMana()
	protected readonly GUIHealth = new GUIHealth()

	constructor(public readonly Owner: Unit) {}

	protected get IsToss() {
		return this.Owner.HasBuffByName("modifier_tiny_toss")
	}
	protected get IsTeleported() {
		return this.Owner.TPStartPosition.IsValid && this.Owner.TPEndPosition.IsValid
	}
	protected get Positions(): [Nullable<Vector2>, Nullable<Vector2>] {
		const tossPosition = this.GetPositionByToss()
		const owner = this.Owner,
			start = this.IsTeleported
				? owner.TPStartPosition
				: (tossPosition ?? owner.Position),
			end = this.IsTeleported ? owner.TPEndPosition : undefined
		return [
			this.HealthBarPosition(owner, start),
			end?.IsValid ? this.HealthBarPosition(owner, end) : undefined
		]
	}
	public Draw(menu: MenuManager) {
		const hpMenu = menu.Health,
			mpMenu = menu.Mana
		const owner = this.Owner
		if (owner.IsHideWorldHud || !owner.IsAlive) {
			return
		}
		const isVisible = owner.IsFogVisible || owner.IsVisible || this.IsTeleported
		if (!isVisible || !this.CanUpdateGUI()) {
			return
		}
		this.GUIMana.Draw(mpMenu, owner)
		this.GUIHealth.Draw(hpMenu, owner)
	}
	protected GetPositionByToss() {
		if (!this.IsToss) {
			return undefined
		}
		const newZ = GetPositionHeight(this.Owner.Position)
		return this.Owner.Position.Clone().SetZ(newZ)
	}
	protected CanUpdateGUI() {
		const [start, end] = this.Positions
		const healthBarSize = this.Owner.HealthBarSize
		this.GUIMana.Update(start, healthBarSize, end)
		this.GUIHealth.Update(start, healthBarSize, end)
		return true
	}
	protected IsContains(position: Nullable<Vector2>) {
		if (position === undefined) {
			return false
		}
		return (
			GUIInfo.ContainsShop(position) ||
			GUIInfo.ContainsMiniMap(position) ||
			GUIInfo.ContainsScoreboard(position)
		)
	}
	protected HealthBarPosition(
		owner: Unit,
		origin: Nullable<Vector3>
	): Nullable<Vector2> {
		const position = (origin ?? owner.Position)
			.Clone()
			.AddScalarZ(owner.HealthBarOffset)
		const screenPosition = RendererSDK.WorldToScreen(position)
		if (screenPosition === undefined) {
			return undefined
		}
		if (owner.HasVisualShield) {
			screenPosition.AddScalarY(5)
		}
		return screenPosition.SubtractForThis(owner.HealthBarPositionCorrection)
	}
}
