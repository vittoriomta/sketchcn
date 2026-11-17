import { LayoutTemplate } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { ACCENT, Kbd } from "./chrome"
import { Modal } from "./commands"
import type { SketchDoc } from "./format"
import { ScreenThumb } from "./preview"
import type { Theme } from "./theme"
import type { Template } from "./templates"
import { TEMPLATES } from "./templates"

export type Built = ReturnType<Template["build"]>

const GROUPS = ["Starter", "App", "AI"] as const

/** Pick a template: see every screen it brings, then add them or start over from it. */
export function TemplateGallery({
  onClose,
  onInsert,
  initial,
  theme,
}: {
  onClose: () => void
  onInsert: (built: Built, mode: "add" | "replace") => void
  initial?: string
  theme?: Theme
}) {
  const [index, setIndex] = useState(() => Math.max(0, TEMPLATES.findIndex((t) => t.id === initial)))
  const template = TEMPLATES[index]
  // Built once per pick, so the thumbnails and the inserted screens are the same.
  const built = useMemo(() => template.build(), [template])
  const app: SketchDoc["app"] = { name: built.app ?? "App", nav: built.nav }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        e.stopImmediatePropagation()
        setIndex((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + TEMPLATES.length) % TEMPLATES.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        e.stopImmediatePropagation()
        onInsert(built, e.shiftKey ? "replace" : "add")
      } else if (e.key === "Escape") {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", k, true)
    return () => window.removeEventListener("keydown", k, true)
  }, [built, onClose, onInsert])

  const count = built.screens.length

  return (
    <Modal onClose={onClose} className="flex h-[min(620px,calc(100vh-120px))] w-[min(980px,calc(100vw-32px))] flex-col" top="9vh">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-(--skc-border) px-4">
        <LayoutTemplate className="size-4 text-(--skc-muted)" />
        <span className="font-medium">Templates</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-(--skc-muted)">
          <Kbd>↑↓</Kbd> choose <Kbd>↵</Kbd> add <Kbd>⇧↵</Kbd> start from <Kbd>esc</Kbd>
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div role="listbox" aria-label="Templates" className="skc-scroll w-60 shrink-0 overflow-y-auto border-r border-(--skc-border) p-2">
          {GROUPS.map((group) => {
            const items = TEMPLATES.map((t, i) => [t, i] as const).filter(([t]) => (t.category ?? "Starter") === group)
            if (!items.length) return null
            return (
              <div key={group} className="pb-2">
                <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-(--skc-muted)">{group}</div>
                {items.map(([t, i]) => (
                  <button
                    key={t.id}
                    type="button"
                    role="option"
                    aria-selected={i === index}
                    onClick={() => setIndex(i)}
                    className={`flex h-8 w-full items-center rounded-md px-3 text-left text-[12px] ${i === index ? "bg-(--skc-active) font-medium" : "hover:bg-(--skc-hover)"}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        <div className="skc-scroll min-w-0 flex-1 overflow-y-auto bg-(--skc-canvas) p-5">
          <div className="grid grid-cols-2 gap-5">
            {built.screens.map((s) => (
              <figure key={s.id} className="grid gap-2">
                <ScreenThumb screen={s} app={app} theme={theme} width={330} />
                <figcaption className="flex items-baseline gap-2 text-[12px]">
                  <span className="font-medium">{s.name}</span>
                  <span className="truncate font-mono text-[11px] text-(--skc-muted)">{s.path}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
      <div className="flex h-14 shrink-0 items-center gap-2 border-t border-(--skc-border) px-4">
        <span className="min-w-0 truncate text-[12px] text-(--skc-muted)" title={template.credit}>
          {count} screens, linked. {template.credit ?? "Every part stays editable."}
        </span>
        <button
          type="button"
          onClick={() => onInsert(built, "replace")}
          className="ml-auto h-8 rounded-md px-3 text-[13px] text-(--skc-muted) hover:bg-(--skc-hover) hover:text-(--skc-fg)"
          title="Replace the current sketch  ⇧↵"
        >
          Start from this
        </button>
        <button
          type="button"
          onClick={() => onInsert(built, "add")}
          className="h-8 rounded-md px-3 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,.12)] hover:brightness-110"
          style={{ background: ACCENT }}
          title="Add to the current sketch  ↵"
        >
          Add {count} screens
        </button>
      </div>
    </Modal>
  )
}
