import { ETextEffect } from "../enum"
import { BarsIcons } from "./icons"

/**
 * How the numbers on the bars are set: the face, its size and weight, the colour, and what the
 * glyphs stand on. The page carries one shared set; each bar carries a settings row of its own
 * that follows the shared set until its override is switched on, the way the cooldowns strips
 * are styled.
 */
export class TextStyleMenu {
	public readonly Node: Menu.Node
	public readonly Override: Nullable<Menu.Toggle>
	public readonly Font: Menu.Dropdown
	public readonly Size: Menu.Slider
	public readonly Weight: Menu.Dropdown
	public readonly Color: Menu.ColorPicker
	public readonly Effect: Menu.Dropdown
	public readonly EffectColor: Menu.ColorPicker
	public readonly EffectOpacity: Menu.Slider

	private readonly families = MenuSDK.MenuFontFamilies()
	private readonly weights = [400, 500, 600, 700]

	constructor(
		parent: Menu.Node,
		private readonly shared?: TextStyleMenu
	) {
		const node =
			shared === undefined
				? parent.AddNode(
						"Style",
						BarsIcons.Style,
						"How the numbers on the bars are set"
					)
				: parent.AddSettings("Text settings", BarsIcons.Style)
		this.Node = node
		node.SortNodes = false
		if (shared !== undefined) {
			this.Override = node.AddToggle(
				"Override",
				false,
				"Use separate text settings for this bar"
			)
		}
		this.Font = node.AddDropdown("Font", ["Default", ...this.families])
		this.Font.IconPath = BarsIcons.Style
		this.Size = node.AddSlider(
			"Text size",
			100,
			70,
			150,
			0,
			"Scales the numbers on the bars.\nThe mana bar grows to hold its own"
		)
		this.Size.Suffix = "%"
		this.Size.IconPath = BarsIcons.TextSize
		this.Weight = node.AddDropdown(
			"Weight",
			["Regular", "Medium", "Semi-bold", "Bold"],
			3
		)
		this.Weight.IconPath = BarsIcons.Style
		this.Color = node.AddColorPicker("Text color", Color.White).SolidOnly()
		this.Color.IconPath = BarsIcons.TextColor
		this.Effect = node.AddDropdown(
			"Under text",
			["None", "Shadow", "Outline", "Soft shadow"],
			ETextEffect.Outline
		)
		this.Effect.IconPath = BarsIcons.TextEffect
		this.EffectColor = node.AddColorPicker("Effect color", Color.Black).SolidOnly()
		this.EffectColor.IconPath = BarsIcons.Palette
		this.EffectOpacity = node.AddSlider("Text shade opacity", 100, 0, 100)
		this.EffectOpacity.Suffix = "%"
		this.EffectOpacity.IconPath = BarsIcons.Opacity
		const syncEffect = () => {
			const inherited = this.Override !== undefined && !this.Override.value
			this.Font.IsHidden = this.Size.IsHidden = this.Weight.IsHidden = inherited
			this.Color.IsHidden = this.Effect.IsHidden = inherited
			this.EffectColor.IsHidden = this.EffectOpacity.IsHidden =
				inherited || this.Effect.SelectedID === ETextEffect.None
			node.Update()
		}
		this.Effect.OnValue(syncEffect)
		this.Override?.OnValue(syncEffect)
		syncEffect()
	}

	/** The settings in force: the shared ones until this bar's override is on. */
	public get Effective(): TextStyleMenu {
		return this.shared !== undefined && !this.Override?.value ? this.shared : this
	}

	public get FontFamily(): string {
		return this.families[this.Font.SelectedID - 1] ?? MenuSDK.Theme.FontFamily
	}

	public get FontWeight(): number {
		return this.weights[this.Weight.SelectedID] ?? 700
	}
}
