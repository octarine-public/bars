
import { GUIHealth } from "../gui/health"
import { GUIMana } from "../gui/mana"
import { MenuManager } from "../menu/index"

const TP_END_KIND = RendererSDK.AllocateAnchorKind()
const TOSS_KIND = RendererSDK.AllocateAnchorKind()

export class UnitData {
	public Priority = Infinity
	protected readonly GUIMana = new GUIMana()
	protected readonly GUIHealth = new GUIHealth()

	private static readonly drawAnchor = new Vector2()

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
	public DrawContent2D(menu: MenuManager) {
		this.setPriority()
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
		const healthBarSize = owner.HealthBarSize,
			startAnchor = start !== undefined ? UnitData.drawAnchor : undefined,
			endAnchor = end !== undefined ? UnitData.drawAnchor : undefined
		this.GUIMana.Update(startAnchor, healthBarSize, endAnchor)
		this.GUIHealth.Update(startAnchor, healthBarSize, endAnchor)

		const index = owner.Index
		if (start !== undefined) {
			const isToss = this.IsToss
			RendererSDK.DrawEntityRelative(
				index,
				isToss ? TOSS_KIND : AnchorKind.HealthBar,
				isToss
					? () => this.HealthBarPosition(owner, this.GetPositionByToss())
					: () =>
							this.HealthBarPosition(
								owner,
								this.IsTeleported ? owner.TPStartPosition : owner.Position
							),
				() => {
					this.GUIMana.Draw(mpMenu, owner)
					this.GUIHealth.Draw(hpMenu, owner)
				}
			)
		}
		if (this.IsTeleported && end !== undefined) {
			RendererSDK.DrawEntityRelative(
				index,
				TP_END_KIND,
				() => {
					const tpEnd = owner.TPEndPosition
					return tpEnd.IsValid
						? this.HealthBarPosition(owner, tpEnd)
						: undefined
				},
				() => {
					this.GUIMana.Draw(mpMenu, owner, true)
					this.GUIHealth.Draw(hpMenu, owner, true)
				}
			)
		}
	}
	protected GetPositionByToss() {
		if (!this.IsToss) {
			return undefined
		}
		const newZ = Dota2SDK.GetPositionHeight(this.Owner.Position)
		return this.Owner.Position.Clone().SetZ(newZ)
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
	private setPriority() {
		let w2s = RendererSDK.WorldToScreen(this.Owner.Position)
		const [start, end] = this.Positions
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
