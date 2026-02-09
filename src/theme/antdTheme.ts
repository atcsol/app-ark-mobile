import type { Theme } from '@ant-design/react-native/lib/style';
import { colors, type Colors } from './colors';

/**
 * ARK Garage - Ant Design React Native theme overrides
 *
 * Creates a theme object from the given color palette.
 * Used by ThemeProvider to generate a dynamic Ant Design theme.
 */
export function createAntdTheme(c: Colors): Partial<Theme> {
  return {
    // ---- Brand colors ----
    brand_primary: c.primary,
    brand_primary_tap: c.primaryLight,
    brand_success: c.success,
    brand_warning: c.warning,
    brand_error: c.error,

    // ---- Text colors ----
    color_text_base: c.textPrimary,
    color_text_base_inverse: c.textInverse,
    color_text_placeholder: c.textPlaceholder,
    color_text_disabled: c.disabled,
    color_text_caption: c.textTertiary,
    color_text_paragraph: c.textSecondary,
    color_link: c.accent,

    // ---- Fill / background colors ----
    fill_body: c.background,
    fill_base: c.white,
    fill_tap: c.gray200,
    fill_disabled: c.gray200,
    fill_mask: c.overlay,
    fill_grey: c.gray50,

    // ---- Borders ----
    border_color_base: c.border,
    border_color_thin: c.divider,

    // ---- Font sizes ----
    font_size_icontext: 10,
    font_size_caption_sm: 12,
    font_size_base: 14,
    font_size_subhead: 15,
    font_size_caption: 16,
    font_size_heading: 17,

    // ---- Border radii ----
    radius_xs: 2,
    radius_sm: 4,
    radius_md: 8,
    radius_lg: 12,

    // ---- Button overrides ----
    primary_button_fill: c.primary,
    primary_button_fill_tap: c.primaryLight,
    ghost_button_color: c.accent,
    ghost_button_fill_tap: `${c.accent}26`, // 15% opacity
    warning_button_fill: c.error,
    warning_button_fill_tap: c.errorDark,

    // ---- Tab bar ----
    tab_bar_fill: c.white,

    // ---- Switch ----
    switch_unchecked: c.gray300,

    // ---- Checkbox ----
    checkbox_fill_disabled: c.gray100,
    checkbox_border: c.gray300,

    // ---- Search bar ----
    search_bar_fill: c.gray100,
    search_color_icon: c.textTertiary,
  };
}

/** Backward-compatible static theme (light palette) */
export const antdTheme = createAntdTheme(colors);
