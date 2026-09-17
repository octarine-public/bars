import { surface } from "../../render"
import { GUIBars } from "../gui/bars"
import { MenuManager } from "../menu/index"

/**
 * Buffs the game takes its own bar off a unit under while the unit stays in sight: in the
 * air over a toss or a cyclone, disguised as a tree, blurred, or in the shadow realm.
 */
const hiddenBarBuffs = [
	"modifier_tiny_toss",
	"modifier_eul_cyclone",
	"modifier_wind_waker",
	"modifier_monkey_king_transform",
	"modifier_phantom_assassin_blur_active",
	"modifier_dark_willow_shadow_realm_buff"
]

export class UnitData {
	public Priority = Infinity
	protected readonly GUI = new GUIBars(surface)

	constructor(public readonly Owner: Unit) {}

	protected get IsToss() {
		return this.Owner.HasBuffByName("modifier_tiny_toss")
	}
	protected get IsTeleported() {
		return this.Owner.TPStartPosition.IsValid && this.Owner.TPEndPosition.IsValid
	}
	/**
	 * Whether the bar stands in for the game's own over the unit. The game draws one over
	 * every unit in sight, so ours goes only where it does not: over a unit in the fog or
	 * teleporting out of sight, or one in sight under a buff that takes its bar away.
	 */
	protected get StandsIn() {
		const owner = this.Owner
		return owner.IsVisible
			? owner.HasAnyBuffByNames(hiddenBarBuffs)
			: owner.IsFogVisible || this.IsTeleported
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
		const owner = this.Owner
		if (owner.IsHideWorldHud || !owner.IsAlive) {
			return
		}
		const standsIn = this.StandsIn
		// the unit keeps the game's own bar: the numbers are added to it, a bar of ours is not
		const readoutsOnly = !standsIn && owner.IsVisible && menu.NumbersOverVisible
		// the far end of a teleport carries a bar either way: the game draws none there
		if (!standsIn && !readoutsOnly && !this.IsTeleported) {
			return
		}
		const [from, end] = this.Positions
		const start = standsIn || readoutsOnly ? from : undefined
		if (start === undefined && end === undefined) {
			return
		}
		this.setPriority(start, end)
		this.GUI.Update(start, owner.HealthBarSize, end)
		if (start !== undefined) {
			this.GUI.Draw(menu, owner, false, readoutsOnly)
		}
		if (end !== undefined) {
			this.GUI.Draw(menu, owner, true)
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
