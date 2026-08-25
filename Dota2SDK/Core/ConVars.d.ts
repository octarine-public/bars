// AUTO-GENERATED - do not edit.
type ConVarRaw = Nullable<number | boolean | string | number[]>
declare class CConVars {
	public GetBoolean(convarName: string, defaultValue: boolean): boolean
	public GetFloat(convarName: string, defaultValue: number): number
	public GetInt(convarName: string, defaultValue: number): number
	public GetString(convarName: string, defaultValue: string): string
	public GetDefaultBoolean(convarName: string, defaultValue: boolean): boolean
	public GetDefaultFloat(convarName: string, defaultValue: number): number
	public GetDefaultInt(convarName: string, defaultValue: number): number
	public GetDefaultString(convarName: string, defaultValue: string): string
	public Set<T extends string | number | boolean>(name: string, value: T): void
}
declare const ConVarsSDK: CConVars
