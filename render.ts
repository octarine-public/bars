import { HudCanvas } from "./src/gui/canvas"

/**
 * The one overlay every bar is drawn on - backing, frame, fills, readouts and icons in a single
 * pool of the script's own elements, the way the cooldowns overlay draws its strips.
 */
export const surface = new HudCanvas()

MenuSDK.RegisterPanel(
	"bars-overlay",
	() =>
		React.createElement("div", {
			ref: surface.Ref,
			style: {
				position: "absolute",
				left: "0px",
				top: "0px",
				zIndex: 1,
				pointerEvents: "none"
			}
		}),
	MenuSDK.EPanelLayer.World
)
