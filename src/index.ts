import "./translations"

import {
	DOTAGameState,
	DOTAGameUIState,
	Entity,
	EventsSDK,
	GameRules,
	GameState,
	npc_dota_brewmaster_earth,
	npc_dota_brewmaster_storm,
	npc_dota_brewmaster_void,
	npc_dota_visage_familiar,
	SpiritBear,
	Unit
} from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "./menu/index"
import { UnitData } from "./models/index"

new (class CBars {
	private readonly menu = new MenuManager()
	private readonly units: UnitData[] = []
	private readonly cachedUnits = new WeakSet<Unit>()

	constructor() {
		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("EntityCreated", this.EntityCreated.bind(this))
		EventsSDK.on("EntityDestroyed", this.EntityDestroyed.bind(this))
		EventsSDK.on("UnitPropertyChanged", this.UnitPropertyChanged.bind(this))
	}
	protected get State() {
		return this.menu.State.value
	}
	protected get IsUIGame() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}
	protected get IsPostGame() {
		return (
			GameRules === undefined ||
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}
	public Draw() {
		if (!this.State || !this.IsUIGame || this.IsPostGame) {
			return
		}
		const mpState = this.menu.State.value,
			hpState = this.menu.State.value
		if (!hpState && !mpState) {
			return
		}
		const arr = this.units.orderBy(x => x.Priority)
		for (let i = arr.length - 1; i > -1; i--) {
			arr[i].Draw(this.menu)
		}
	}
	public EntityCreated(entity: Entity) {
		if (this.ShouldBeUnit(entity)) {
			this.GetOrAddUnitData(entity)
		}
	}
	public EntityDestroyed(entity: Entity) {
		if (this.isUnit(entity) && this.cachedUnits.has(entity)) {
			this.cachedUnits.delete(entity)
			this.units.removeCallback(x => x.Owner === entity)
		}
	}
	public UnitPropertyChanged(unit: Unit) {
		if (!this.cachedUnits.has(unit) || !unit.IsValid || this.isIllusion(unit)) {
			return
		}
		if (this.isSpiritBear(unit) && !unit.ShouldRespawn) {
			this.units.removeCallback(x => x.Owner === unit)
			this.cachedUnits.delete(unit)
			return
		}
		if (this.ShouldBeUnit(unit)) {
			this.GetOrAddUnitData(unit)
		}
	}
	protected GetOrAddUnitData(entity: Unit): Nullable<UnitData> {
		if (!entity.IsValid || this.isIllusion(entity)) {
			this.units.removeCallback(x => x.Owner === entity)
			this.cachedUnits.delete(entity)
			return
		}
		let getUnitData = this.units.find(x => x.Owner === entity)
		if (getUnitData === undefined) {
			getUnitData = new UnitData(entity)
			this.units.push(getUnitData)
			this.cachedUnits.add(entity)
			return getUnitData
		}
		return getUnitData
	}
	protected ShouldBeUnit(entity: Nullable<Entity>): entity is Unit {
		if (!this.isUnit(entity) || !entity.IsEnemy() || this.isIllusion(entity)) {
			return false
		}
		if (entity.IsHero) {
			return true
		}
		if (this.isSpiritBear(entity)) {
			return entity.ShouldRespawn
		}
		return (
			entity instanceof npc_dota_visage_familiar &&
			entity instanceof npc_dota_brewmaster_void &&
			entity instanceof npc_dota_brewmaster_storm &&
			entity instanceof npc_dota_brewmaster_earth
		)
	}
	private isIllusion(unit: Unit) {
		return unit.IsIllusion && !unit.IsStrongIllusion
	}
	private isUnit(entity: Nullable<Entity>): entity is Unit {
		return entity?.IsUnit ?? false
	}
	private isSpiritBear(unit: Unit): unit is SpiritBear {
		return unit.IsSpiritBear
	}
})()
