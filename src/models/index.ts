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
	/** Where the bar stands: over the unit, or where a teleport took it from, and where it lands. */
	protected get Anchors(): [Nullable<Vector2>, Nullable<Vector2>] {
		const owner = this.Owner
		if (this.IsTeleported) {
			return [
				owner.HealthBarAnchor(owner.TPStartPosition),
				owner.HealthBarAnchor(owner.TPEndPosition)
			]
		}
		return [
			owner.HealthBarAnchor(this.GetPositionByToss() ?? owner.Position),
			undefined
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
		const [from, end] = this.Anchors
		const start = standsIn || readoutsOnly ? from : undefined
		if (start === undefined && end === undefined) {
			return
		}
		this.setPriority(start, end)
		if (start !== undefined) {
			this.GUI.Draw(menu, owner, owner.GetHeroHealthBar(start), readoutsOnly)
		}
		if (end !== undefined) {
			this.GUI.Draw(menu, owner, owner.GetHeroHealthBar(end))
		}
	}
	protected GetPositionByToss() {
		if (!this.IsToss) {
			return undefined
		}
		const newZ = Dota2SDK.GetPositionHeight(this.Owner.Position)
		return this.Owner.Position.Clone().SetZ(newZ)
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
