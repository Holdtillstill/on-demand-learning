export const BG = 'var(--figma-v2-bg)';
export const SURF = 'var(--figma-v2-surface)';
export const SURF2 = 'var(--figma-v2-surface-2)';
export const SURF3 = 'var(--figma-v2-surface-3)';
export const BORDER = 'var(--figma-v2-border)';
export const BORDER2 = 'var(--figma-v2-border-2)';
export const TEXT = 'var(--figma-v2-text)';
export const TEXT2 = 'var(--figma-v2-text-2)';
export const TEXT3 = 'var(--figma-v2-text-3)';
export const ACCENT = 'var(--figma-v2-accent)';
export const ACCENT_BG = 'var(--figma-v2-accent-bg)';
export const GREEN = 'var(--figma-v2-green)';
export const GREEN_BG = 'var(--figma-v2-green-bg)';
export const AMBER = 'var(--figma-v2-amber)';
export const AMBER_BG = 'var(--figma-v2-amber-bg)';
export const BLUE = 'var(--figma-v2-blue)';
export const BLUE_BG = 'var(--figma-v2-blue-bg)';
export const RED = 'var(--figma-v2-red)';
export const RED_BG = 'var(--figma-v2-red-bg)';
export const PURPLE = 'var(--figma-v2-purple)';
export const PURPLE_BG = 'var(--figma-v2-purple-bg)';
export const TERMINAL = 'var(--figma-v2-terminal)';
export const CODE_TEXT = 'var(--figma-v2-code-text)';

export function alpha(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
