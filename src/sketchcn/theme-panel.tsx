import { Check, Moon, Sun } from "lucide-react"
import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { ACCENT, Segmented } from "./chrome"
import type { Theme } from "./theme"
import { ACCENT_NAMES, BASE_NAMES, FONTS, PRESETS, RADII, describeTheme, fontOf, isProjectTheme, loadFont, themeVars } from "./theme"
import { ACCENTS, BASES } from "./theme-data"

const same = (a: Theme = {}, b: Theme = {}) =>
  a.base === b.base && a.accent === b.accent && a.radius === b.radius && a.font === b.font && (a.mode ?? "light") === (b.mode ?? "light")

function Group({ title, value, children }: { title: string; value?: string; children: ReactNode }) {
  return (
    <section className="grid gap-2 px-4 py-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[12px] font-medium">{title}</h3>
        {value && <span className="text-[11px] text-(--skc-muted) capitalize">{value}</span>}
      </div>
      {children}
    </section>
  )
}

function Swatch({ color, ring, active, title, onClick }: { color: string; ring?: string; active: boolean; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className="relative size-6 rounded-full"
      style={{ background: color, boxShadow: active ? `0 0 0 2px var(--skc-bg), 0 0 0 4px ${ACCENT}` : `inset 0 0 0 1px ${ring ?? "rgba(0,0,0,.12)"}` }}
    >
      {active && <Check className="absolute inset-0 m-auto size-3 text-white mix-blend-difference" strokeWidth={3} />}
    </button>
  )
}

/** Fast theme picks: presets first, then each token on its own. Changes apply live to the sketch. */
export function ThemePanel({ theme, onChange, onClose }: { theme?: Theme; onChange: (t: Theme | undefined, merge?: string) => void; onClose: () => void }) {
  const t = theme ?? {}
  const ref = useRef<HTMLDivElement>(null)
  const set = (patch: Partial<Theme>, merge?: string) => {
    const next = { ...t, ...patch }
    for (const k of Object.keys(next) as (keyof Theme)[]) if (next[k] === undefined) delete next[k]
    onChange(Object.keys(next).length ? next : undefined, merge)
  }

  useEffect(() => FONTS.forEach((f) => loadFont(f.id)), [])
  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !(e.target as HTMLElement).closest("[data-theme-trigger]")) onClose()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener("pointerdown", down, true)
    window.addEventListener("keydown", key, true)
    return () => {
      window.removeEventListener("pointerdown", down, true)
      window.removeEventListener("keydown", key, true)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="skc-pop skc-scroll absolute top-[calc(100%+6px)] right-0 z-50 max-h-[calc(100vh-80px)] w-[340px] overflow-y-auto rounded-xl border border-(--skc-border) bg-(--skc-popover) shadow-[0_16px_48px_-12px_rgba(0,0,0,.28)]"
    >
      <div className="flex items-center justify-between border-b border-(--skc-border) px-4 py-2.5">
        <div className="min-w-0">
          <div className="font-medium">Theme</div>
          <div className="truncate text-[11px] text-(--skc-muted)">{describeTheme(theme)}</div>
        </div>
        {!isProjectTheme(theme) && (
          <button type="button" onClick={() => onChange(undefined)} className="h-7 rounded-md px-2 text-[12px] text-(--skc-muted) hover:bg-(--skc-hover) hover:text-(--skc-fg)">
            Reset
          </button>
        )}
      </div>

      <Group title="Presets">
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => {
            const v = themeVars(p.theme, p.theme.mode ?? "light")
            const active = same(t, p.theme)
            const font = fontOf(p.theme.font)
            const radius = p.theme.radius ?? 0.625
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(p.id === "project" ? undefined : { ...p.theme })}
                className="grid gap-1.5 rounded-lg p-1 text-left hover:bg-(--skc-hover)"
                style={{ boxShadow: active ? `0 0 0 2px ${ACCENT}` : undefined }}
              >
                <div
                  className="grid h-12 place-items-center overflow-hidden border"
                  style={{
                    borderRadius: Math.min(10, radius * 12 + 2),
                    background: v.background ?? "#fff",
                    color: v.foreground ?? "#111",
                    borderColor: v.border ?? "rgba(0,0,0,.1)",
                    fontFamily: font ? `"${font.family}"` : undefined,
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] leading-none font-semibold">Aa</span>
                    <span className="size-2.5 rounded-full" style={{ background: v.primary ?? "#171717", borderRadius: radius ? 999 : 1 }} />
                  </div>
                </div>
                <span className="truncate px-0.5 text-[11px]">{p.name}</span>
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Base" value={t.base ?? "project"}>
        <div className="flex flex-wrap gap-2">
          {BASE_NAMES.map((b) => (
            <Swatch key={b} title={b} color={BASES[b].light["muted-foreground"]} active={t.base === b} onClick={() => set({ base: t.base === b ? undefined : b })} />
          ))}
        </div>
      </Group>

      <Group title="Accent" value={t.accent ?? "none"}>
        <div className="flex flex-wrap gap-2">
          {ACCENT_NAMES.map((a) => (
            <Swatch key={a} title={a} color={ACCENTS[a][500]} ring="transparent" active={t.accent === a} onClick={() => set({ accent: t.accent === a ? undefined : a })} />
          ))}
        </div>
      </Group>

      <Group title="Radius" value={t.radius !== undefined ? `${t.radius}rem` : "project"}>
        <div className="grid grid-cols-6 gap-1">
          {RADII.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={t.radius === r}
              title={`${r}rem`}
              onClick={() => set({ radius: t.radius === r ? undefined : r })}
              className={`grid h-9 place-items-center rounded-md ${t.radius === r ? "bg-(--skc-active)" : "hover:bg-(--skc-hover)"}`}
            >
              <span className="block size-4 border-t-2 border-l-2 border-(--skc-fg)" style={{ borderTopLeftRadius: r * 14 }} />
            </button>
          ))}
        </div>
      </Group>

      <Group title="Font" value={fontOf(t.font)?.label ?? "project"}>
        <div className="grid grid-cols-2 gap-1">
          {FONTS.map((font) => (
            <button
              key={font.id}
              type="button"
              aria-pressed={t.font === font.id}
              onClick={() => set({ font: t.font === font.id ? undefined : font.id })}
              className={`flex h-9 items-center justify-between gap-2 rounded-md px-2.5 text-left ${t.font === font.id ? "bg-(--skc-active)" : "hover:bg-(--skc-hover)"}`}
            >
              <span className="truncate text-[13.5px]" style={{ fontFamily: `"${font.family}"` }}>
                {font.label}
              </span>
              {font.kind !== "sans" && <span className="text-[10px] text-(--skc-faint)">{font.kind}</span>}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Preview">
        <Segmented<"light" | "dark">
          value={t.mode ?? "light"}
          onChange={(mode) => set({ mode: mode === "light" ? undefined : mode })}
          options={[
            { value: "light", label: "Light", icon: <span className="flex items-center gap-1.5 [&_svg]:size-3.5"><Sun /> Light</span> },
            { value: "dark", label: "Dark", icon: <span className="flex items-center gap-1.5 [&_svg]:size-3.5"><Moon /> Dark</span> },
          ]}
        />
      </Group>
      <p className="px-4 pb-4 text-[11px] leading-relaxed text-(--skc-faint)">The prompt carries the tokens and font install, so your agent applies the same theme to the project.</p>
    </div>
  )
}
