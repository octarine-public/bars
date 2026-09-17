import { BarsIcons } from "../menu/icons"
import { PreviewController, PreviewRow } from "./controller"

const rowHint = "Click to switch the number · Right-click for settings"
const localize = (text: string) => MenuSDK.Localization.Localize(text)

export function PreviewHeader({ preview }: { preview: PreviewController }) {
	const menu = preview.Menu
	const open = MenuSDK.ElementSettingsNode()
	return (
		<React.Fragment>
			<MenuSDK.StageChip
				icon={BarsIcons.Health}
				label="Health"
				on={open === menu.Health.Tree}
				press={() => preview.Open(menu.Health.Tree)}
			/>
			<MenuSDK.StageChip
				icon={BarsIcons.Mana}
				label="Mana"
				on={open === menu.Mana.Tree}
				press={() => preview.Open(menu.Mana.Tree)}
			/>
			<MenuSDK.StageChip
				icon={BarsIcons.Style}
				label="Style"
				on={open === menu.Style.Node}
				press={() => preview.Open(menu.Style.Node)}
			/>
		</React.Fragment>
	)
}

function RowArea({ preview, row }: { preview: PreviewController; row: PreviewRow }) {
	return (
		<div
			ref={row.AreaRef}
			style={{
				position: "absolute",
				display: "none",
				pointerEvents: "auto"
			}}
			onMouseOver={event => {
				if (event.target === event.currentTarget) {
					row.Hovered = true
					MenuSDK.ShowChipTooltip(
						event.currentTarget,
						localize(row.Label),
						"top",
						localize(rowHint)
					)
				}
			}}
			onMouseOut={event => {
				if (event.target === event.currentTarget) {
					row.Hovered = false
					MenuSDK.HideChipTooltip(event.currentTarget)
				}
			}}
			onMouseUp={event => {
				if (event.data.button === 0) {
					preview.Toggle(row)
				} else if (event.data.button === 1) {
					MenuSDK.HideChipTooltip(event.currentTarget)
					preview.Open(row.Menu.Tree)
				}
				event.stopPropagation()
			}}
		/>
	)
}

export function PreviewStage({ preview }: { preview: PreviewController }) {
	return (
		<React.Fragment>
			<div
				style={{
					position: "absolute",
					left: "30%",
					top: "48%",
					width: "40%",
					height: "32%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					pointerEvents: "none",
					color: MenuSDK.Tokens.TextMuted
				}}
			>
				<MenuSDK.Icon
					path={BarsIcons.Hero}
					size={72}
					tint={MenuSDK.Tokens.TextDisabled}
				/>
				<div
					style={{
						marginTop: 12,
						fontSize: 11,
						textAlign: "center",
						whiteSpace: "normal"
					}}
				>
					{localize("3D model will be added later")}
				</div>
			</div>
			<div
				ref={preview.Canvas.Ref}
				style={{
					position: "absolute",
					left: 0,
					top: 0,
					width: "100%",
					height: "100%",
					pointerEvents: "none"
				}}
			/>
			<RowArea preview={preview} row={preview.Health} />
			<RowArea preview={preview} row={preview.Mana} />
		</React.Fragment>
	)
}
