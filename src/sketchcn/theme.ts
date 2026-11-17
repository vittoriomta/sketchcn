// Themes: pick a base palette, an accent, a radius and a font, like `shadcn create`.
// Nothing set means the project's own theme; every choice is an override on top of it.

import type { CSSProperties } from "react"
import { ACCENTS, BASES } from "./theme-data"
import type { Vars } from "./theme-data"

export type Theme = {
  base?: string
  accent?: string
  /** rem */
  radius?: number
  font?: string
  /** How the sketch is previewed. */
  mode?: "light" | "dark"
}

export const BASE_NAMES = Object.keys(BASES)
export const ACCENT_NAMES = Object.keys(ACCENTS)
export const RADII = [0, 0.3, 0.5, 0.625, 0.75, 1]

export type Font = { id: string; label: string; family: string; google: string; fontsource: string; kind: "sans" | "serif" | "mono" }
const f = (id: string, label: string, google: string, fontsource: string, kind: Font["kind"] = "sans"): Font => ({ id, label, family: label, google, fontsource, kind })
export const FONTS: Font[] = [
  f("geist", "Geist", "Geist:wght@100..900", "@fontsource-variable/geist"),
  f("inter", "Inter", "Inter:wght@100..900", "@fontsource-variable/inter"),
  f("figtree", "Figtree", "Figtree:wght@300..900", "@fontsource-variable/figtree"),
  f("dm-sans", "DM Sans", "DM+Sans:wght@100..1000", "@fontsource-variable/dm-sans"),
  f("manrope", "Manrope", "Manrope:wght@200..800", "@fontsource-variable/manrope"),
  f("plus-jakarta", "Plus Jakarta Sans", "Plus+Jakarta+Sans:wght@200..800", "@fontsource-variable/plus-jakarta-sans"),
  f("outfit", "Outfit", "Outfit:wght@100..900", "@fontsource-variable/outfit"),
  f("nunito-sans", "Nunito Sans", "Nunito+Sans:wght@200..1000", "@fontsource-variable/nunito-sans"),
  f("space-grotesk", "Space Grotesk", "Space+Grotesk:wght@300..700", "@fontsource-variable/space-grotesk"),
  f("ibm-plex", "IBM Plex Sans", "IBM+Plex+Sans:wght@100..700", "@fontsource-variable/ibm-plex-sans"),
  f("source-serif", "Source Serif 4", "Source+Serif+4:wght@200..900", "@fontsource-variable/source-serif-4", "serif"),
  f("geist-mono", "Geist Mono", "Geist+Mono:wght@100..900", "@fontsource-variable/geist-mono", "mono"),
  f("jetbrains-mono", "JetBrains Mono", "JetBrains+Mono:wght@100..800", "@fontsource-variable/jetbrains-mono", "mono"),
]
export const fontOf = (id?: string) => FONTS.find((x) => x.id === id)

export type Preset = { id: string; name: string; theme: Theme }
export const PRESETS: Preset[] = [
  { id: "project", name: "Project", theme: {} },
  { id: "ocean", name: "Ocean", theme: { base: "slate", accent: "blue", radius: 0.5, font: "inter" } },
  { id: "forest", name: "Forest", theme: { base: "stone", accent: "emerald", radius: 0.75, font: "figtree" } },
  { id: "sunset", name: "Sunset", theme: { base: "taupe", accent: "orange", radius: 1, font: "outfit" } },
  { id: "grape", name: "Grape", theme: { base: "mauve", accent: "violet", radius: 0.625, font: "plus-jakarta" } },
  { id: "rose", name: "Rose", theme: { base: "neutral", accent: "rose", radius: 0.75, font: "dm-sans" } },
  { id: "editorial", name: "Editorial", theme: { base: "olive", radius: 0.3, font: "source-serif" } },
  { id: "terminal", name: "Terminal", theme: { base: "zinc", accent: "lime", radius: 0, font: "jetbrains-mono", mode: "dark" } },
]

const LIGHT_ACCENTS = new Set(["amber", "yellow", "lime"])

/** Accent tokens for one mode. */
function accentVars(name: string, mode: "light" | "dark"): Vars {
  const a = ACCENTS[name]
  if (!a) return {}
  const pale = LIGHT_ACCENTS.has(name)
  const primary = mode === "dark" || pale ? a[500] : a[600]
  const fg = pale ? a[950] : "oklch(0.985 0 0)"
  return {
    primary,
    "primary-foreground": fg,
    ring: a[400],
    "chart-1": a[300],
    "chart-2": a[500],
    "chart-3": a[600],
    "chart-4": a[700],
    "chart-5": a[800],
    "sidebar-primary": primary,
    "sidebar-primary-foreground": fg,
    "sidebar-ring": a[400],
  }
}

/** Every token the theme changes, for one mode. */
export function themeVars(t: Theme | undefined, mode: "light" | "dark"): Vars {
  if (!t) return {}
  const v: Vars = { ...(t.base ? BASES[t.base]?.[mode] : {}), ...(t.accent ? accentVars(t.accent, mode) : {}) }
  if (t.radius !== undefined) v.radius = `${t.radius}rem`
  const font = fontOf(t.font)
  if (font) v["font-sans"] = `"${font.family}", ui-sans-serif, system-ui, sans-serif`
  return v
}

/** Inline style that applies the theme to an element (the frame or a thumbnail). */
export function themeStyle(t: Theme | undefined): CSSProperties {
  const vars = themeVars(t, t?.mode ?? "light")
  const style: Record<string, string> = {}
  for (const [k, val] of Object.entries(vars)) style[`--${k}`] = val
  if (vars["font-sans"]) style.fontFamily = vars["font-sans"]
  return style as CSSProperties
}

export const isProjectTheme = (t?: Theme) => !t || (!t.base && !t.accent && t.radius === undefined && !t.font)

/** Loads a Google font for the preview, once. The project itself should install the fontsource package. */
export function loadFont(id?: string) {
  const font = fontOf(id)
  if (!font || typeof document === "undefined") return
  if (document.querySelector(`link[data-sketchcn-font="${font.id}"]`)) return
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`
  link.dataset.sketchcnFont = font.id
  document.head.appendChild(link)
}

/** The theme as CSS the agent can paste into the project's globals.css. */
export function themeCSS(t: Theme | undefined) {
  if (isProjectTheme(t)) return ""
  const block = (sel: string, vars: Vars) => {
    const lines = Object.entries(vars)
      .filter(([k]) => k !== "font-sans")
      .map(([k, v]) => `  --${k}: ${v};`)
    return lines.length ? `${sel} {\n${lines.join("\n")}\n}` : ""
  }
  const light = themeVars(t, "light")
  const dark = themeVars(t, "dark")
  delete dark.radius
  const font = fontOf(t?.font)
  const theme = font ? `@theme inline {\n  --font-sans: "${font.family}${font.fontsource.includes("variable") ? " Variable" : ""}", ui-sans-serif, system-ui, sans-serif;\n}` : ""
  return [block(":root", light), block(".dark", dark), theme].filter(Boolean).join("\n\n")
}

export function describeTheme(t: Theme | undefined) {
  if (isProjectTheme(t)) return "Project theme"
  return [t?.base && `${t.base} base`, t?.accent && `${t.accent} accent`, t?.radius !== undefined && `${t.radius}rem radius`, fontOf(t?.font)?.label]
    .filter(Boolean)
    .join(" · ")
}
