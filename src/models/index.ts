import {
	GetPositionHeight,
	GUIInfo,
	modifierstate,
	Unit,
	Vector2
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

	public Draw(menu: MenuManager) {
		const hpMenu = menu.Health,
			mpMenu = menu.Mana

		const owner = this.Owner
		if (owner.HideHud || !owner.IsAlive) {
			return
		}
		const isVisible = owner.IsVisible || owner.IsFogVisible
		if (!isVisible) {
			return
		}
		const isNoHealthBar = owner.IsUnitStateFlagSet(
			modifierstate.MODIFIER_STATE_NO_HEALTH_BAR
		)
		if (isNoHealthBar || !this.CanUpdateGUI()) {
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
		const healthBarPosition = this.Owner.HealthBarPosition(true, tossPosition)
		if (healthBarPosition === undefined || this.IsContains(healthBarPosition)) {
			return false
		}
		const healthBarSize = this.Owner.HealthBarSize
		this.GUIMana.Update(healthBarPosition, healthBarSize)
		this.GUIHealth.Update(healthBarPosition, healthBarSize)
		return true
	}

	protected IsContains(position: Vector2) {
		return (
			GUIInfo.ContainsShop(position) ||
			GUIInfo.ContainsMiniMap(position) ||
			GUIInfo.ContainsScoreboard(position)
		)
	}
}
