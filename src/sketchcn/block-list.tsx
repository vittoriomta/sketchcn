import { ArrowLeft, ArrowRight, ChevronRight, Eye, Search } from "lucide-react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { BlockSpec } from "./blocks"
import { BLOCKS, BLOCK_GROUPS, BLOCK_WIDTH, buildBlock } from "./blocks"
import { ACCENT, Kbd, plain } from "./chrome"
import { Modal } from "./commands"
import { useDrag } from "./drag"
import { StaticNode } from "./preview"
import type { Theme } from "./theme"
import { themeStyle } from "./theme"

const CLOSED_KEY = "sketchcn:block-groups"
const readClosed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(CLOSED_KEY) ?? "[]") as string[]
  } catch {
    return []
  }
}

/** A block drawn at its natural width, then scaled to fit the card both ways (contain) and centered. */
function BlockThumb({ block, theme }: { block: BlockSpec; theme?: Theme }) {
  const node = useMemo(() => buildBlock(block), [block])
  const natural = BLOCK_WIDTH[block.width ?? "full"]
  const inner = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<{ scale: number; w: number; h: number } | null>(null)
  const boxW = 184
  const boxH = 112
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const w = el.scrollWidth
    const h = el.scrollHeight
    // Fit the width; if that makes it taller than the card, show the top and fade the rest.
    setFit({ scale: Math.min((boxW - 16) / w, 0.9), w, h })
  }, [node])
  const scale = fit?.scale ?? (boxW - 16) / natural
  return (
    <div className="relative overflow-hidden rounded-md border border-(--skc-border) bg-white" style={{ height: boxH }}>
      <div
        ref={inner}
        className={`skc-frame pointer-events-none absolute top-0 left-0 bg-background p-3 text-foreground ${theme?.mode === "dark" ? "dark" : ""}`}
        style={{
          ...themeStyle(theme),
          width: natural,
          transformOrigin: "top left",
          transform: fit
            ? `translate(${(boxW - 2 - fit.w * scale) / 2}px, ${Math.max(0, (boxH - 2 - fit.h * scale) / 2)}px) scale(${scale})`
            : `scale(${scale})`,
        }}
        aria-hidden
        inert
      >
        <StaticNode node={node} />
      </div>
      {fit && fit.h * scale > boxH - 2 && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />}
    </div>
  )
}

/** A block at full size, so it can be judged properly. ← → flip through its group, Enter inserts. */
function BlockPreview({ block, siblings, onPick, onInsert, onClose, theme }: { block: BlockSpec; siblings: BlockSpec[]; onPick: (b: BlockSpec) => void; onInsert: (b: BlockSpec) => void; onClose: () => void; theme?: Theme }) {
  const node = useMemo(() => buildBlock(block), [block])
  const natural = BLOCK_WIDTH[block.width ?? "full"]
  const area = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const w = area.current?.clientWidth ?? natural
    setScale(Math.min(1, (w - 64) / natural))
  }, [natural, block])
  const i = siblings.findIndex((b) => b.id === block.id)
  const go = (d: number) => onPick(siblings[(i + d + siblings.length) % siblings.length])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault()
        e.stopImmediatePropagation()
        go(e.key === "ArrowRight" ? 1 : -1)
      } else if (e.key === "Enter") {
        e.preventDefault()
        e.stopImmediatePropagation()
        onInsert(block)
      } else if (e.key === "Escape") {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", k, true)
    return () => window.removeEventListener("keydown", k, true)
  })
  return (
    <Modal onClose={onClose} top="6vh" className="flex max-h-[86vh] w-[min(1180px,calc(100vw-48px))] flex-col">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-(--skc-border) px-4">
        <div className="min-w-0 truncate font-medium">{block.name}</div>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] text-(--skc-muted)">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd> variants <Kbd>↵</Kbd> insert <Kbd>esc</Kbd>
        </span>
      </div>
      <div
        ref={area}
        className="skc-scroll flex min-h-0 flex-1 justify-center overflow-auto bg-(--skc-canvas) p-8"
        style={{ backgroundImage: "radial-gradient(var(--skc-dot) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
      >
        <div style={{ width: natural * scale, zoom: 1 }} className="shrink-0">
          <div
            className={`skc-frame pointer-events-none rounded-xl border bg-background p-5 text-foreground shadow-[0_8px_32px_-8px_rgba(0,0,0,.18)] ${theme?.mode === "dark" ? "dark" : ""}`}
            style={{ ...themeStyle(theme), width: natural, transform: `scale(${scale})`, transformOrigin: "top left" }}
            inert
          >
            <StaticNode node={node} />
          </div>
        </div>
      </div>
      <div className="flex h-14 shrink-0 items-center gap-2 border-t border-(--skc-border) px-4">
        <button type="button" onClick={() => go(-1)} aria-label="Previous variant" className="flex size-8 items-center justify-center rounded-md text-(--skc-muted) hover:bg-(--skc-hover) hover:text-(--skc-fg) [&_svg]:size-4">
          <ArrowLeft />
        </button>
        <span className="text-[12px] text-(--skc-muted) tabular-nums">
          {block.group} · {i + 1} / {siblings.length}
        </span>
        <button type="button" onClick={() => go(1)} aria-label="Next variant" className="flex size-8 items-center justify-center rounded-md text-(--skc-muted) hover:bg-(--skc-hover) hover:text-(--skc-fg) [&_svg]:size-4">
          <ArrowRight />
        </button>
        <button
          type="button"
          onClick={() => onInsert(block)}
          className="ml-auto h-8 rounded-md px-3 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,.12)] hover:brightness-110"
          style={{ background: ACCENT }}
        >
          Insert
        </button>
      </div>
    </Modal>
  )
}

/** Designed sections, grouped, with thumbnails. Click to insert after the selection, or drag onto the canvas. */
export function BlockList({ onAdd, theme }: { onAdd: (block: BlockSpec) => void; theme?: Theme }) {
  const { begin } = useDrag()
  const [filter, setFilter] = useState("")
  const [closed, setClosed] = useState<string[]>(readClosed)
  const [previewing, setPreviewing] = useState<BlockSpec | null>(null)
  const q = filter.trim().toLowerCase()
  const shown = BLOCKS.filter((b) => !q || `${b.name} ${b.group} ${b.description}`.toLowerCase().includes(q))
  const toggle = (g: string) =>
    setClosed((c) => {
      const next = c.includes(g) ? c.filter((x) => x !== g) : [...c, g]
      try {
        localStorage.setItem(CLOSED_KEY, JSON.stringify(next))
      } catch {
        // Remembering folds is a convenience.
      }
      return next
    })

  return (
    <>
      <div className="relative mx-3 mt-2 mb-1">
        <Search className="pointer-events-none absolute top-1/2 left-0 size-3.5 -translate-y-1/2 text-(--skc-faint)" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && shown[0]) {
              onAdd(shown[0])
              setFilter("")
              e.currentTarget.blur()
            } else if (e.key === "Escape") {
              setFilter("")
              e.currentTarget.blur()
            }
          }}
          placeholder={`Search ${BLOCKS.length} blocks`}
          aria-label="Filter blocks"
          className="h-7 w-full bg-transparent pl-5 text-[13px] outline-none placeholder:text-(--skc-faint)"
          {...plain}
        />
      </div>
      <div className="skc-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {BLOCK_GROUPS.map((g) => {
          const items = shown.filter((b) => b.group === g)
          if (!items.length) return null
          const open = !!q || !closed.includes(g)
          return (
            <div key={g} className="pb-1">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(g)}
                className="group/cat flex h-7 w-full items-center gap-1 rounded-md px-2 text-[11px] text-(--skc-muted) hover:text-(--skc-fg)"
              >
                <ChevronRight className={`size-3 transition-transform duration-150 ${open ? "rotate-90" : ""}`} />
                {g}
                <span className="ml-auto text-(--skc-faint) tabular-nums opacity-0 group-hover/cat:opacity-100">{items.length}</span>
              </button>
              {open && (
                <div className="grid gap-2 px-1 pb-2">
                  {items.map((b) => (
                    <div
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => begin(e, { kind: "block", id: b.id, type: "block", name: b.name })}
                      onClick={() => onAdd(b)}
                      onKeyDown={(e) => e.key === "Enter" && onAdd(b)}
                      className="group/block relative grid touch-none gap-1.5 rounded-lg p-1 transition-colors duration-150 select-none hover:bg-(--skc-hover)"
                    >
                      <BlockThumb block={b} theme={theme} />
                      <button
                        type="button"
                        aria-label={`Preview ${b.name}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewing(b)
                        }}
                        className="absolute top-2.5 right-2.5 flex h-6 items-center gap-1 rounded-md bg-(--skc-tip) px-1.5 text-[11px] font-medium text-(--skc-tip-fg) opacity-0 shadow-sm transition-opacity group-hover/block:opacity-100 focus-visible:opacity-100 [&_svg]:size-3.5"
                      >
                        <Eye /> Preview
                      </button>
                      <span className="truncate px-0.5 text-[12px]">{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {shown.length === 0 && <p className="px-2 py-6 text-center text-(--skc-muted)">{BLOCKS.length ? `Nothing for «${filter}».` : "Blocks are on their way."}</p>}
      </div>
      {previewing && (
        <BlockPreview
          block={previewing}
          siblings={BLOCKS.filter((b) => b.group === previewing.group)}
          onPick={setPreviewing}
          onInsert={(b) => {
            setPreviewing(null)
            onAdd(b)
          }}
          onClose={() => setPreviewing(null)}
          theme={theme}
        />
      )}
    </>
  )
}
