// sketchcn's own interface: theme, controls, toasts and confirms. Nothing here uses the
// host's ui components, so the tool looks the same in every project; only the sketch
// inside the frame renders with the project's shadcn components and theme.

import { useEffect, useId, useRef, useState } from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

export const ACCENT = "#3b82f6"

const CSS = `
.skc {
  --skc-bg: #fbfbfa; --skc-canvas: #ededea; --skc-fg: #1d1f1c; --skc-muted: #6f716c; --skc-faint: #a3a59f;
  --skc-border: #e4e4e0; --skc-hover: #efefec; --skc-active: #e5e5e1; --skc-input: #d7d7d2; --skc-field: #fff;
  --skc-popover: #fff; --skc-danger: #b53e2f; --skc-accent: ${ACCENT}; --skc-dot: rgba(29,31,28,.13);
  --skc-ease: cubic-bezier(.32,.72,0,1); --skc-tip: #1d1f1c; --skc-tip-fg: #fff;
  font: 13px/1.45 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
  letter-spacing: normal; text-align: left; color: var(--skc-fg); color-scheme: light;
  -webkit-font-smoothing: antialiased; -webkit-user-select: none; user-select: none; cursor: default;
}
:where(html.dark) .skc, .skc[data-theme="dark"] {
  --skc-bg: #1f1f1e; --skc-canvas: #161615; --skc-fg: #ececea; --skc-muted: #9d9d98; --skc-faint: #6c6c68;
  --skc-border: #323230; --skc-hover: #2a2a28; --skc-active: #333331; --skc-input: #42423e; --skc-field: #262625;
  --skc-popover: #262625; --skc-danger: #e0675a; --skc-dot: rgba(236,236,234,.09); --skc-tip: #ececea; --skc-tip-fg: #1d1f1c; color-scheme: dark;
}
@media (prefers-color-scheme: dark) {
  :where(html:not(.light)) .skc:not([data-theme="light"]) {
    --skc-bg: #1f1f1e; --skc-canvas: #161615; --skc-fg: #ececea; --skc-muted: #9d9d98; --skc-faint: #6c6c68;
    --skc-border: #323230; --skc-hover: #2a2a28; --skc-active: #333331; --skc-input: #42423e; --skc-field: #262625;
    --skc-popover: #262625; --skc-danger: #e0675a; --skc-dot: rgba(236,236,234,.09); --skc-tip: #ececea; --skc-tip-fg: #1d1f1c; color-scheme: dark;
  }
}
@layer base {
  /* Chrome only: never reaches the sketch inside .skc-frame, which stays pure shadcn. */
  .skc *, .skc *::before, .skc *::after { box-sizing: border-box; border-color: var(--skc-border); }
  .skc :where(input, textarea):not(:where(.skc-frame *)) { -webkit-user-select: text; user-select: text; font: inherit; color: inherit; }
  .skc :where(button):not(:where(.skc-frame *)) { cursor: default; font: inherit; color: inherit; background: none;
    transition: color .15s ease, background-color .15s ease, opacity .15s ease, transform .15s var(--skc-ease); }
  .skc :where(button):not(:where(.skc-frame *)):active:not(:disabled) { transform: scale(.97); }
  .skc :where([role="option"]):active { transform: none; }
  .skc :where(button):not(:where(.skc-frame *)):disabled { opacity: .35; }
  .skc :where(input, textarea, select, button):not(:where(.skc-frame *)):focus { outline: none; }
  .skc :where(button, [role="button"]):not(:where(.skc-frame *)):focus-visible { outline: 2px solid color-mix(in srgb, var(--skc-fg) 25%, transparent); outline-offset: 2px; }
  .skc input[type=number]::-webkit-inner-spin-button, .skc input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .skc input[type=number] { -moz-appearance: textfield; appearance: textfield; }
  /* The sketch is the host app: its own font, colours and borders. */
  .skc .skc-frame { font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif); font-size: 16px; line-height: 1.5; letter-spacing: normal;
    color: var(--foreground); -webkit-user-select: none; user-select: none; }
  .skc .skc-frame * { border-color: var(--border); }
  /* Grid children may shrink, so a long truncated line never widens a narrow pane. */
  .skc .skc-frame :where(.grid) > * { min-width: 0; }
  .skc .skc-frame * { scrollbar-width: none; }
  /* Phones: panes stack like the md: breakpoints in the prompt, and a sidebar hides behind a menu button. */
  .skc .skc-mobile .skc-split { grid-template-columns: minmax(0, 1fr) !important; min-height: 0; }
  .skc .skc-mobile .skc-split > * + * { border-left-width: 0 !important; }
  .skc .skc-mobile .skc-split-side > :first-child { display: none !important; }
  .skc .skc-mobile .skc-split-side::before { content: ""; display: block; height: 48px; border-bottom: 1px solid var(--border);
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M4 6h16M4 12h16M4 18h16'/%3E%3C/svg%3E") no-repeat 16px center; }
  .skc .skc-mobile .skc-split-side .skc-split-side > :first-child { display: flex !important; }
  .skc .skc-mobile .skc-split-side .skc-split-side::before { content: none; }
  /* Bars stay one line on a phone: only the current page, no search, tabs clipped. */
  .skc .skc-mobile .skc-bar { padding-left: 16px; padding-right: 16px; overflow: hidden; }
  .skc .skc-mobile .skc-bar .flex-wrap { flex-wrap: nowrap !important; }
  .skc .skc-mobile .skc-bar * { white-space: nowrap; }
  .skc .skc-mobile .skc-bar nav[aria-label="Breadcrumb"] > .contents { display: none !important; }
  .skc .skc-mobile .skc-bar [data-slot="input-group"], .skc .skc-mobile .skc-bar [data-slot="tabs"] { display: none !important; }
  .skc .skc-frame *::-webkit-scrollbar { display: none; }
}
@keyframes skc-in { from { opacity: 0; transform: translateY(6px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes skc-pop { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
.skc-toast { animation: skc-in .22s var(--skc-ease); transition: opacity .2s ease, transform .2s ease; }
.skc-toast[data-out] { opacity: 0; transform: translateY(4px); }
.skc-pop { animation: skc-pop .18s var(--skc-ease); }
@media (prefers-reduced-motion: reduce) { .skc-toast, .skc-pop { animation: none; } .skc button:active:not(:disabled) { transform: none; } }
@keyframes skc-tip-in { from { opacity: 0; transform: var(--skc-tip-from, translate(-50%, 2px)) scale(.96); } }
.skc-tip { animation: skc-tip-in .14s var(--skc-ease); }
/* Opening sketchcn: the workspace grows out of the launcher corner. */
@keyframes skc-open { from { opacity: 0; transform: scale(.985); } to { opacity: 1; transform: none; } }
@keyframes skc-close { to { opacity: 0; transform: scale(.985); } }
.skc-open { transform-origin: 100% 100%; animation: skc-open .32s var(--skc-ease); }
.skc-closing { transform-origin: 100% 100%; animation: skc-close .18s ease-in forwards; }
@keyframes skc-launch { from { opacity: 0; transform: scale(.6); } }
.skc-launcher { animation: skc-launch .3s var(--skc-ease); }
@media (prefers-reduced-motion: reduce) { .skc-tip, .skc-open, .skc-closing, .skc-launcher { animation: none; } }
/* Scrollbars: thin, invisible until you hover or scroll the area. */
.skc .skc-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; scrollbar-gutter: stable; }
.skc .skc-scroll:hover, .skc .skc-scroll[data-scrolling] { scrollbar-color: color-mix(in srgb, var(--skc-fg) 20%, transparent) transparent; }
/* Dragging: one cursor everywhere, nothing selects. */
html[data-skc-dragging], html[data-skc-dragging] * { cursor: grabbing !important; -webkit-user-select: none !important; user-select: none !important; }
.skc-ghost { display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 10px 0 8px; border-radius: 8px; white-space: nowrap;
  background: var(--skc-popover); color: var(--skc-fg); border: 1px solid var(--skc-border); font-size: 13px; font-weight: 500;
  box-shadow: 0 12px 28px -8px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.08); transform: rotate(-2deg); animation: skc-ghost-in .18s var(--skc-ease); }
.skc-ghost svg { width: 16px; height: 16px; color: var(--skc-muted); }
.skc-ghost-where { margin-left: 2px; padding-left: 8px; border-left: 1px solid var(--skc-border); font-size: 11px; font-weight: 500; color: var(--skc-accent); transition: color .12s; }
.skc-ghost-where[data-off] { color: var(--skc-faint); }
@keyframes skc-ghost-in { from { opacity: 0; transform: scale(.92) rotate(0deg); } }
@keyframes skc-landed { 0% { box-shadow: 0 0 0 4px ${ACCENT}66; } 100% { box-shadow: 0 0 0 10px ${ACCENT}00; } }
.skc-landed { animation: skc-landed .6s var(--skc-ease); }
@media (prefers-reduced-motion: reduce) { .skc-ghost, .skc-landed { animation: none; } }
`

export function ChromeStyle() {
  return <style data-sketchcn="">{CSS}</style>
}

/** Fields are names, codes and copy, not prose: no autocorrect or suggestions. */
export const plain = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
} as const

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ")

// ── Controls ────────────────────────────────────────────────────────────

// ── Tooltips ────────────────────────────────────────────────────────────
// A small dark pill with the shortcut, after a short delay; once one
// is showing, moving to the next trigger shows its tip at once ("warm").

let warmUntil = 0

export function Tip({ label, keys, side = "bottom", children }: { label: string; keys?: string; side?: "top" | "bottom" | "left"; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const show = () => {
    window.clearTimeout(timer.current)
    const open = () => {
      const r = ref.current?.firstElementChild?.getBoundingClientRect()
      if (!r) return
      setPos(side === "top" ? { x: r.left + r.width / 2, y: r.top - 6 } : side === "left" ? { x: r.left - 8, y: r.top + r.height / 2 } : { x: r.left + r.width / 2, y: r.bottom + 6 })
    }
    if (Date.now() < warmUntil) open()
    else timer.current = window.setTimeout(open, 450)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    if (pos) warmUntil = Date.now() + 400
    setPos(null)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <span ref={ref} className="contents" onPointerEnter={show} onPointerLeave={hide} onPointerDown={hide} onFocus={show} onBlur={hide}>
      {children}
      {pos && (
        <span
          role="tooltip"
          className="skc-tip pointer-events-none fixed z-[2147483647] flex items-center gap-1.5 rounded-md bg-(--skc-tip) px-2 py-1 text-[11px] font-medium whitespace-nowrap text-(--skc-tip-fg) shadow-[0_4px_12px_rgba(0,0,0,.18)]"
          style={{
            left: pos.x,
            top: pos.y,
            transform: side === "top" ? "translate(-50%, -100%)" : side === "left" ? "translate(-100%, -50%)" : "translate(-50%, 0)",
          }}
        >
          {label}
          {keys && <span className="font-normal opacity-55">{keys}</span>}
        </span>
      )}
    </span>
  )
}

export function IconButton({
  label,
  keys,
  active,
  danger,
  side,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; keys?: string; active?: boolean; danger?: boolean; side?: "top" | "bottom" | "left" }) {
  return (
    <Tip label={label} keys={keys} side={side}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        {...rest}
        className={cx(
          "flex size-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.5",
          danger ? "bg-(--skc-danger)/10 text-(--skc-danger)" : active ? "bg-(--skc-active) text-(--skc-fg)" : "text-(--skc-muted) hover:bg-(--skc-hover) hover:text-(--skc-fg)",
          className,
        )}
      >
        {children}
      </button>
    </Tip>
  )
}

/** Two icons in one spot: the active one sharpens in, the other blurs out. */
export function IconSwap({ on, a, b }: { on: boolean; a: ReactNode; b: ReactNode }) {
  const layer = "absolute inset-0 flex items-center justify-center transition-[opacity,transform,filter] duration-200 [transition-timing-function:var(--skc-ease)]"
  return (
    <span className="relative inline-flex size-3.5 shrink-0">
      <span className={layer} style={{ opacity: on ? 0 : 1, transform: on ? "scale(.5)" : "none", filter: on ? "blur(3px)" : "none" }}>
        {a}
      </span>
      <span className={layer} style={{ opacity: on ? 1 : 0, transform: on ? "none" : "scale(.5)", filter: on ? "none" : "blur(3px)" }}>
        {b}
      </span>
    </span>
  )
}

/** Small text button used in toolbars and section headers. */
export function TextButton({ className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] text-(--skc-muted) hover:bg-(--skc-hover) hover:text-(--skc-fg) [&_svg]:size-3.5",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="grid min-w-0 gap-1">
      <label htmlFor={id} className="text-[11px] text-(--skc-muted)">
        {label}
      </label>
      {children(id)}
      {hint && <div className="text-[11px] text-(--skc-faint)">{hint}</div>}
    </div>
  )
}

const fieldClass =
  "w-full min-w-0 rounded-[5px] border border-(--skc-input) bg-(--skc-field) px-2 text-[12px] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-(--skc-faint) focus:border-(--skc-accent) focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--skc-accent)_18%,transparent)]"

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  mono,
  type = "text",
}: {
  id?: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  type?: "text" | "number"
}) {
  return (
    <input
      id={id}
      type={type}
      inputMode={type === "number" ? "decimal" : undefined}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
      className={cx(fieldClass, "h-7", mono && "font-mono text-[11px]")}
      {...plain}
    />
  )
}

export function TextArea({ id, value, onChange, placeholder }: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      id={id}
      value={value}
      placeholder={placeholder}
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
      className={cx(fieldClass, "min-h-14 resize-none py-1 leading-snug")}
      {...plain}
    />
  )
}

/** Native select dressed as a field: keyboard and OS menus for free. */
export function Select({
  id,
  value,
  onChange,
  options,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cx(fieldClass, "h-7 appearance-none pr-6")}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-(--skc-muted)" viewBox="0 0 12 12" fill="none">
        <path d="M3.5 4.75 6 2.5l2.5 2.25M3.5 7.25 6 9.5l2.5-2.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function Toggle({ id, on, onChange }: { id?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cx("relative h-[18px] w-[30px] shrink-0 rounded-full", on ? "bg-(--skc-accent)" : "bg-(--skc-input)")}
    >
      <span
        className="absolute top-[2px] left-[2px] size-[14px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.25)] transition-transform duration-200"
        style={{ transform: on ? "translateX(12px)" : "none", transitionTimingFunction: "var(--skc-ease)" }}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string; icon?: ReactNode }[]
  onChange: (v: T) => void
}) {
  const index = options.findIndex((o) => o.value === value)
  return (
    <div className="relative grid auto-cols-fr grid-flow-col rounded-md bg-(--skc-hover) p-0.5">
      {/* The pill slides to the active option instead of jumping. */}
      {index >= 0 && (
        <span
          aria-hidden
          className="absolute top-0.5 bottom-0.5 left-0.5 rounded-[4px] bg-(--skc-field) shadow-[0_1px_2px_rgba(0,0,0,.08),0_0_0_.5px_rgba(0,0,0,.04)] transition-transform duration-200 [transition-timing-function:var(--skc-ease)]"
          style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          aria-label={o.icon ? o.label : undefined}
          title={o.icon ? o.label : undefined}
          onClick={() => onChange(o.value)}
          className={cx(
            "relative flex h-6 items-center justify-center rounded-[4px] px-2 text-[11px] [&_svg]:size-3.5",
            value === o.value ? "font-medium text-(--skc-fg)" : "text-(--skc-muted) hover:text-(--skc-fg)",
          )}
        >
          {o.icon ?? o.label}
        </button>
      ))}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-(--skc-border) bg-(--skc-bg) px-1 font-sans text-[10.5px] text-(--skc-muted) tabular-nums">
      {children}
    </kbd>
  )
}

// ── Second click to confirm ─────────────────────────────────────────────

/** Destructive actions arm on the first click and fire on the second, within 4 s. */
export function useConfirm() {
  const [armed, setArmed] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return {
    armed,
    ask(key: string, run: () => void) {
      if (armed === key) {
        window.clearTimeout(timer.current)
        setArmed(null)
        run()
        return
      }
      setArmed(key)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setArmed(null), 4000)
    },
  }
}

// ── Toasts ──────────────────────────────────────────────────────────────

type Toast = { id: number; text: string; action?: { label: string; run: () => void }; out?: boolean }
let toasts: Toast[] = []
let seq = 0
const listeners = new Set<(t: Toast[]) => void>()
const timers = new Map<number, number>()
const emit = () => listeners.forEach((f) => f(toasts))

function dismiss(id: number) {
  window.clearTimeout(timers.get(id))
  toasts = toasts.map((t) => (t.id === id ? { ...t, out: true } : t))
  emit()
  timers.set(
    id,
    window.setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      timers.delete(id)
      emit()
    }, 200),
  )
}

/** A one-line pill at the bottom. With an action it stays longer (Undo). */
export function toast(text: string, action?: Toast["action"]) {
  const id = ++seq
  toasts = [...toasts.filter((t) => !t.out), { id, text, action }].slice(-3)
  emit()
  timers.set(id, window.setTimeout(() => dismiss(id), action ? 5000 : 2200))
  return id
}

export function Toaster() {
  const [list, setList] = useState<Toast[]>(toasts)
  useEffect(() => {
    listeners.add(setList)
    return () => {
      listeners.delete(setList)
    }
  }, [])
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-12 left-1/2 z-[2147483647] grid -translate-x-1/2 justify-items-center gap-1.5">
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          data-out={t.out ? "" : undefined}
          className="skc-toast pointer-events-auto inline-flex h-8 items-center gap-2 rounded-full border border-(--skc-border) bg-(--skc-popover) pr-1.5 pl-3.5 text-[13px] whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          style={{ paddingRight: t.action ? 4 : 14 }}
        >
          {t.text}
          {t.action && (
            <button
              type="button"
              onClick={() => {
                dismiss(t.id)
                t.action?.run()
              }}
              className="h-6 rounded-full bg-(--skc-fg) px-2.5 text-[12px] font-medium text-(--skc-bg) hover:opacity-85"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

/** Marks a scrolled area for a moment so its scrollbar shows while you scroll, then hides. */
export function useScrollbars(root: React.RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const timers = new WeakMap<Element, number>()
    const onScroll = (e: Event) => {
      const t = e.target as HTMLElement
      if (!t.classList?.contains("skc-scroll")) return
      t.setAttribute("data-scrolling", "")
      window.clearTimeout(timers.get(t))
      timers.set(t, window.setTimeout(() => t.removeAttribute("data-scrolling"), 900))
    }
    el.addEventListener("scroll", onScroll, { capture: true, passive: true })
    return () => el.removeEventListener("scroll", onScroll, { capture: true })
  }, [root, active])
}
