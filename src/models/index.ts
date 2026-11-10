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

/**
 * Where a bar is laid out before the anchor moves it: far enough from the corner that every edge
 * the layout cuts toward zero is positive, as it is where a bar really stands on the screen.
 */
const layoutOrigin = new Vector2(4096, 4096)
const barFlags = ERenderAnchorFlags.Snap | ERenderAnchorFlags.HealthBarPixel
const projected: [number, number] = [0, 0]

export class UnitData {
	public Priority = Infinity
	protected readonly GUI = new GUIBars(surface)
	/** Where a bar stands that does not follow the unit: in the fog, over a toss, a teleport's start. */
	private readonly from = new CRenderAnchor()
	/** Where a teleport lands. */
	private readonly to = new CRenderAnchor()

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
	public Draw(menu: MenuManager) {
		const owner = this.Owner
		if (owner.IsHideWorldHud || !owner.IsAlive) {
			return
		}
		const standsIn = this.StandsIn
		const teleported = this.IsTeleported
		// the unit keeps the game's own bar: the numbers are added to it, a bar of ours is not
		const readoutsOnly = !standsIn && owner.IsVisible && menu.NumbersOverVisible
		// the far end of a teleport carries a bar either way: the game draws none there
		if (!standsIn && !readoutsOnly && !teleported) {
			return
		}
		const start = standsIn || readoutsOnly ? this.startAnchor(teleported) : undefined
		const end = teleported
			? this.worldAnchor(this.to, owner.TPEndPosition, owner.TPEndPosition.z)
			: undefined
		if (start === undefined && end === undefined) {
			return
		}
		this.setPriority(start, end)
		const bar = owner.GetHeroHealthBar(layoutOrigin)
		if (
			start !== undefined &&
			surface.AnchorTo(start, -layoutOrigin.x, -layoutOrigin.y)
		) {
			this.GUI.Draw(menu, owner, bar, readoutsOnly)
		}
		if (
			end !== undefined &&
			surface.AnchorTo(end, -layoutOrigin.x, -layoutOrigin.y)
		) {
			this.GUI.Draw(menu, owner, bar)
		}
	}
	/** Frees the anchors of the bars that do not follow the unit; the unit's own goes with it. */
	public Dispose(): void {
		this.from.Free()
		this.to.Free()
	}
	/**
	 * Where the bar over the unit stands: on the unit in sight, or where it was last seen, where a
	 * toss lands it on the ground, or where a teleport took it from. Nothing while it is off the
	 * screen.
	 */
	private startAnchor(teleported: boolean): Nullable<CRenderAnchor> {
		const owner = this.Owner
		if (teleported) {
			const position = owner.TPStartPosition
			return this.worldAnchor(this.from, position, position.z)
		}
		if (this.IsToss) {
			const position = owner.Position
			return this.worldAnchor(
				this.from,
				position,
				Dota2SDK.GetPositionHeight(position)
			)
		}
		if (!owner.IsVisible) {
			return this.worldAnchor(this.from, owner.Position, owner.Position.z)
		}
		return owner.IsOnScreen ? owner.HealthBarRenderAnchor : undefined
	}
	/** Stands `anchor` where the bar over `position` would at height `z`; nothing off the screen. */
	private worldAnchor(
		anchor: CRenderAnchor,
		position: Vector3,
		z: number
	): Nullable<CRenderAnchor> {
		anchor.SetWorld(
			position.x,
			position.y,
			z + this.Owner.HealthBarOffset,
			0,
			0,
			barFlags
		)
		return anchor.Project(projected) ? anchor : undefined
	}
	/** Orders the bars by how near the cursor they stand: the nearest is drawn last, over the rest. */
	private setPriority(start: Nullable<CRenderAnchor>, end: Nullable<CRenderAnchor>) {
		const cursor = InputManager.CursorOnScreen
		const w2s = RendererSDK.WorldToScreen(this.Owner.Position)
		if (w2s !== undefined) {
			this.Priority = w2s.DistanceSqr(cursor)
			return
		}
		if (
			!(start?.Project(projected) ?? false) &&
			!(end?.Project(projected) ?? false)
		) {
			this.Priority = Infinity
			return
		}
		this.Priority = (projected[0] - cursor.x) ** 2 + (projected[1] - cursor.y) ** 2
	}
}
