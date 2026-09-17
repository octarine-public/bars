import { BarUnit } from "../gui/types"

/** The enemy on the stage: a hero in the middle of a game, its bars draining and filling back. */
export class SampleUnit implements BarUnit {
	public readonly IsHero = true
	public readonly Level = 18
	public readonly MaxHP = 2140
	public readonly MaxMana = 1015
	public HP = this.MaxHP
	public Mana = this.MaxMana

	private readonly texture = `${PathData.HeroIconsPath}/npc_dota_hero_void_spirit_png.vtex_c`

	public get HPPercentDecimal(): number {
		return this.HP / this.MaxHP
	}

	public get ManaPercentDecimal(): number {
		return this.Mana / this.MaxMana
	}

	public TexturePath(): string {
		return this.texture
	}

	/** Runs the bars on the preview's clock, so holding the stage still holds them too. */
	public Tick(): void {
		const now = MenuSDK.PreviewClock()
		this.HP = Math.round(this.MaxHP * this.share(now, 14, 0.28))
		this.Mana = Math.round(this.MaxMana * this.share(now + 5, 11, 0.15))
	}

	/**
	 * Where a bar stands over its cycle: it drains from full to `floor` over the first two thirds
	 * of the period and fills back over the last third.
	 */
	private share(now: number, period: number, floor: number): number {
		const phase = (now % period) / period
		const drained = phase < 2 / 3 ? phase / (2 / 3) : (1 - phase) / (1 / 3)
		return 1 - (1 - floor) * drained
	}
}
