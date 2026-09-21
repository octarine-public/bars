import { MenuManager } from "../menu/index"
import { PreviewController } from "./controller"
import { PreviewFooter, PreviewHeader, PreviewStage } from "./view"

/** Mounts the page's preview: the bars over a sample hero, live to every setting on the page. */
export function MountBarsPreview(menu: MenuManager): void {
	const preview = new PreviewController(menu)
	MenuSDK.MountPreview({
		key: "bars-preview",
		scene: new MenuSDK.CPreviewScene(),
		Shown: () => preview.IsShown(),
		Model: () => undefined,
		Header: () => <PreviewHeader preview={preview} />,
		Footer: () => <PreviewFooter preview={preview} />,
		Stage: () => <PreviewStage preview={preview} />,
		Frame: (x, y, w, h) => preview.Place(x, y, w, h),
		Tick: (visible, width, height) => preview.Tick(visible, width, height)
	})
}
