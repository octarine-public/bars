import { MenuManager } from "../menu/index"
import { BarUnit } from "./types"

export abstract class BaseGUI {
	protected readonly position = new Rectangle()
	protected readonly positionEnd = new Rectangle()

	public abstract Draw(menu: MenuManager, owner: BarUnit, isEnded?: boolean): unknown

	public Update(
		position: Nullable<Vector2>,
		size: Vector2,
		positionEnd: Nullable<Vector2>
	): void {
		if (position === undefined) {
			this.position.pos1.Invalidate()
			this.position.pos2.Invalidate()
		} else {
			this.position.pos1.CopyFrom(position)
			this.position.pos2.CopyFrom(position).AddForThis(size)
		}
		if (positionEnd === undefined) {
			this.positionEnd.pos1.Invalidate()
			this.positionEnd.pos2.Invalidate()
		} else {
			this.positionEnd.pos1.CopyFrom(positionEnd)
			this.positionEnd.pos2.CopyFrom(positionEnd).AddForThis(size)
		}
	}
}
