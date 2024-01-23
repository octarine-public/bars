import {
	Color,
	Rectangle,
	RendererSDK,
	Unit,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { BaseMenu } from "../menu/base"

export abstract class BaseGUI {
	protected readonly position = new Rectangle()

	public abstract Draw(menu: BaseMenu, owner: Unit): void

	public Update(position: Vector2, size: Vector2): void {
		this.position.pos1.CopyFrom(position)
		this.position.pos2.CopyFrom(position.Add(size))
	}

	protected DrawBar(decimal: number, insideColor: Color, fillColor: Color): void {
		RendererSDK.FilledRect(this.position.pos1, this.position.Size, insideColor)
		const dPosition = this.position.Clone()
		const minSizeX = 1 / (this.position.Width * 2)
		const size = dPosition.Size.MultiplyScalarX(Math.max(decimal, minSizeX))
		RendererSDK.FilledRect(dPosition.pos1, size, fillColor)
	}
}
