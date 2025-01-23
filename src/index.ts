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
	private readonly units = new Map<Unit, UnitData>()

	constructor() {
		this.menu.MenuChanged(() => this.menuChanged())

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
		this.units.forEach(unit => unit.Draw(this.menu))
	}

	public EntityCreated(entity: Entity) {
		if (this.ShouldBeUnit(entity)) {
			this.GetOrAddUnitData(entity)
		}
	}

	public EntityDestroyed(entity: Entity) {
		if (this.ShouldBeUnit(entity)) {
			this.GetOrAddUnitData(entity)
		}
	}

	public UnitPropertyChanged(unit: Unit) {
		if (unit.IsIllusion || unit.IsHiddenIllusion) {
			return
		}
		if (unit instanceof SpiritBear && !unit.ShouldRespawn) {
			this.units.delete(unit)
			return
		}
		if (!unit.IsClone) {
			return
		}
		if (this.ShouldBeUnit(unit)) {
			this.GetOrAddUnitData(unit)
		}
	}

	protected GetOrAddUnitData(entity: Unit) {
		if (!entity.IsValid) {
			this.units.delete(entity)
			return
		}
		let getUnitData = this.units.get(entity)
		if (getUnitData === undefined) {
			getUnitData = new UnitData(entity)
			this.units.set(entity, getUnitData)
			return getUnitData
		}
		return getUnitData
	}

	protected ShouldBeUnit(entity: Nullable<Entity>): entity is Unit {
		if (!(entity instanceof Unit) || !entity.IsEnemy()) {
			return false
		}
		if (entity.IsIllusion || entity.IsHiddenIllusion) {
			return false
		}
		if (entity.IsHero) {
			return true
		}
		if (entity instanceof SpiritBear) {
			return entity.ShouldRespawn
		}
		return (
			entity instanceof npc_dota_visage_familiar &&
			entity instanceof npc_dota_brewmaster_void &&
			entity instanceof npc_dota_brewmaster_storm &&
			entity instanceof npc_dota_brewmaster_earth
		)
	}

	private menuChanged() {
		/** @only_call */
	}
})()
