// AUTO-GENERATED - do not edit.
declare abstract class UIPanel {
	public readonly Position: Rectangle
	public IsValid: boolean
	constructor(Position: Rectangle)
	public abstract get State(): boolean
	public abstract Draw(): void
	public abstract MouseKeyUp(): boolean
	public abstract MouseKeyDown(): boolean
	public Dispose?(): void
	public Compute(desiredPos?: Vector2): void
}
declare class CUIPanelManager {
	constructor()
	public Register(panel: UIPanel): boolean
	public Unregister<T extends UIPanel>(panel: T): boolean
	public Compute(panel: UIPanel, desiredPos?: Vector2): void
}
declare const UIPanelManager: CUIPanelManager
