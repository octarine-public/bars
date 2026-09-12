import { GUIHealth } from "../gui/health"
import { GUIMana } from "../gui/mana"
import { MenuManager } from "../menu/index"

export class UnitData {
	public Priority = Infinity
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
		if (!isVisible) {
			return
		}
		const [start, end] = this.Positions
		if (start === undefined && end === undefined) {
			return
		}
		this.setPriority(start, end)
		const healthBarSize = owner.HealthBarSize
		this.GUIMana.Update(start, healthBarSize, end)
		this.GUIHealth.Update(start, healthBarSize, end)
		if (start !== undefined) {
			this.GUIMana.Draw(mpMenu, owner)
			this.GUIHealth.Draw(hpMenu, owner)
		}
		if (end !== undefined) {
			this.GUIMana.Draw(mpMenu, owner, true)
			this.GUIHealth.Draw(hpMenu, owner, true)
		}
	}
	protected GetPositionByToss() {
		if (!this.IsToss) {
			return undefined
		}
		const newZ = Dota2SDK.GetPositionHeight(this.Owner.Position)
		return this.Owner.Position.Clone().SetZ(newZ)
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
	private setPriority(start: Nullable<Vector2>, end: Nullable<Vector2>) {
		let w2s = RendererSDK.WorldToScreen(this.Owner.Position)
		if (w2s === undefined) {
			w2s = start
		}
		if (w2s === undefined) {
			w2s = end
		}
		if (w2s === undefined) {
			this.Priority = Infinity
			return
		}
		this.Priority = w2s.DistanceSqr(InputManager.CursorOnScreen)
	}
}
