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

	public Draw(menu: MenuManager) {
		const hpMenu = menu.Health,
			mpMenu = menu.Mana

		const owner = this.Owner
		if (owner.HideHud || !owner.IsAlive) {
			return
		}
		const isVisible = owner.IsVisible || this.IsTeleported
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
		const tossPosition = this.GetPositionByToss()
		const healthBarPosition = this.HealthBarPosition(this.Owner, tossPosition)
		if (this.IsContains(healthBarPosition)) {
			return false
		}
		let endPosition: Nullable<Vector2>
		if (this.IsTeleported) {
			endPosition = this.HealthBarPosition(this.Owner, this.Owner.TPEndPosition)
		}
		const healthBarSize = this.Owner.HealthBarSize
		this.GUIMana.Update(healthBarPosition, healthBarSize, endPosition)
		this.GUIHealth.Update(healthBarPosition, healthBarSize, endPosition)
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
	public HealthBarPosition(owner: Unit, origin: Nullable<Vector3>): Nullable<Vector2> {
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
