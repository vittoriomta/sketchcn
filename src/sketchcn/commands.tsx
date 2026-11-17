import { CornerDownLeft, Search } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { Kbd, plain } from "./chrome"

export type Command = {
  id: string
  group: string
  label: string
  icon?: LucideIcon
  /** Shortcut shown on the right. */
  keys?: string
  /** Extra words that match the search. */
  terms?: string
  run: () => void
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

export function Modal({ onClose, children, className = "", top = "16vh" }: { onClose: () => void; children: ReactNode; className?: string; top?: string }) {
  return (
    <div
      className="fixed inset-0 z-[2147483646] flex items-start justify-center bg-black/20"
      style={{ paddingTop: top }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`skc-pop overflow-hidden rounded-xl border border-(--skc-border) bg-(--skc-popover) shadow-[0_16px_48px_-12px_rgba(0,0,0,.28)] ${className}`}>
        {children}
      </div>
    </div>
  )
}

/** ⌘K: every action, part and screen in one field. Arrows move, Enter runs, Esc closes. */
export function CommandMenu({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [q, setQ] = useState("")
  const [hi, setHi] = useState(0)
  const list = useRef<HTMLDivElement>(null)

  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean)
    if (!words.length) return commands
    const hits = commands.filter((c) => words.every((w) => norm(`${c.label} ${c.group} ${c.terms ?? ""}`).includes(w)))
    // Names that start with what you typed come first.
    const starts = (c: Command) => (norm(c.label).startsWith(norm(q.trim())) || norm(c.label.replace(/^(Add|Go to) /, "")).startsWith(norm(q.trim())) ? 0 : 1)
    return hits.map((c, i) => [c, i] as const).sort((a, b) => starts(a[0]) - starts(b[0]) || a[1] - b[1]).map(([c]) => c)
  }, [commands, q])

  const groups = useMemo(() => {
    if (q.trim()) return [["", shown]] as [string, Command[]][]
    const g: [string, Command[]][] = []
    for (const c of shown) (g.find((x) => x[0] === c.group) ?? g[g.push([c.group, []]) - 1])[1].push(c)
    return g
  }, [shown, q])
  const flat = groups.flatMap(([, cs]) => cs)

  useEffect(() => setHi(0), [q])
  useEffect(() => {
    list.current?.querySelector(`[data-i="${hi}"]`)?.scrollIntoView({ block: "nearest" })
  }, [hi])

  const run = (c: Command) => {
    onClose()
    c.run()
  }
  let i = -1

  return (
    <Modal onClose={onClose} className="w-[min(560px,calc(100vw-32px))]">
      <div className="flex items-center gap-2 border-b border-(--skc-border) px-3">
        <Search className="size-4 text-(--skc-muted)" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Add a component, go to a screen, run an action…"
          aria-label="Search commands"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setHi((h) => Math.min(flat.length - 1, h + 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setHi((h) => Math.max(0, h - 1))
            } else if (e.key === "Enter" && flat[hi]) {
              e.preventDefault()
              run(flat[hi])
            } else if (e.key === "Escape") {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }
          }}
          className="h-11 flex-1 bg-transparent text-[14px] outline-none placeholder:text-(--skc-faint)"
          {...plain}
        />
        <Kbd>esc</Kbd>
      </div>
      <div ref={list} role="listbox" className="skc-scroll max-h-[52vh] overflow-y-auto p-1.5">
        {flat.length === 0 && <p className="px-3 py-6 text-center text-(--skc-muted)">Nothing for «{q}».</p>}
        {groups.map(([g, cs]) => (
          <div key={g || "all"} className="pb-1">
            {g && <div className="px-2 pt-2 pb-1 text-[11px] text-(--skc-muted)">{g}</div>}
            {cs.map((c) => {
              i++
              const me = i
              const Icon = c.icon
              return (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={hi === me}
                  data-i={me}
                  onMouseMove={() => hi !== me && setHi(me)}
                  onClick={() => run(c)}
                  className={`flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px] ${hi === me ? "bg-(--skc-hover)" : ""}`}
                >
                  {Icon && <Icon className="size-4 shrink-0 text-(--skc-muted)" strokeWidth={1.75} />}
                  <span className="truncate">{c.label}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-2">
                    {c.keys && <Kbd>{c.keys}</Kbd>}
                    {hi === me && <CornerDownLeft className="size-3.5 text-(--skc-muted)" />}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export const SHORTCUTS: [string, string][] = [
  ["⌘K", "Search components, screens and actions"],
  ["S", "Open or close sketchcn"],
  ["P", "Preview the flow"],
  ["C", "Copy prompt"],
  ["1 … 9", "Go to screen"],
  ["⌘Z  ⇧⌘Z", "Undo, redo"],
  ["⌘D", "Duplicate"],
  ["⌫", "Delete"],
  ["⌥A  ⌥H  ⌥D", "Align left, center, right"],
  ["⌥W  ⌥V  ⌥S", "Align top, middle, bottom (in a row)"],
  ["↑ ↓", "Select previous or next"],
  ["⇧↑ ⇧↓", "Move up or down"],
  ["Enter", "Select first child"],
  ["Esc", "Select parent, leave preview, close"],
  ["T", "Templates"],
  ["Scroll  Space+drag", "Pan the canvas"],
  ["Pinch  ⌘+scroll", "Zoom at the cursor"],
  ["⇧1  ⇧0", "Zoom to fit, 100%"],
  ["⌘+  ⌘−", "Zoom in, out"],
  ["?", "This list"],
]

export function ShortcutSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", k, true)
    return () => window.removeEventListener("keydown", k, true)
  }, [onClose])
  return (
    <Modal onClose={onClose} className="w-[min(420px,calc(100vw-32px))]">
      <div className="px-5 pt-4 pb-2 text-[15px] font-medium">Keyboard shortcuts</div>
      <div className="grid px-5 pb-3">
        {SHORTCUTS.map(([k, t]) => (
          <div key={k} className="flex items-center justify-between gap-4 border-b border-(--skc-border) py-2 text-[13px] last:border-0">
            <span>{t}</span>
            <span className="flex gap-1">
              {k.split("  ").map((x) => (
                <Kbd key={x}>{x}</Kbd>
              ))}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
