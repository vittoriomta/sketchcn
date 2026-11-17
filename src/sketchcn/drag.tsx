// Pointer-driven drag and drop. No HTML5 DnD: we own the ghost, the hit testing,
// the indicator and auto-scroll, so it feels the same in every browser.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react"
import { ACCENT } from "./chrome"

export type DragPayload = { kind: "new"; type: string } | { kind: "move"; id: string; type: string } | { kind: "block"; id: string; type: "block"; name: string }

type Rect = { x: number; y: number; w: number; h: number }
export type DropTarget = { parentId: string; index: number; line: Rect; empty: boolean; box: Rect; label: string }

type DragState = { payload: DragPayload; x: number; y: number; target: DropTarget | null }

type Ctx = {
  drag: DragState | null
  /** The node that just landed, for a short flash. */
  landed: string | null
  begin: (e: ReactPointerEvent, payload: DragPayload) => void
}

const DragCtx = createContext<Ctx>({ drag: null, landed: null, begin: () => {} })
export const useDrag = () => useContext(DragCtx)

const THRESHOLD = 4
const EDGE = 64
const toRect = (r: DOMRect): Rect => ({ x: r.left, y: r.top, w: r.width, h: r.height })

// Where in `slot` the pointer would drop, and the line to draw for it.
function measure(slot: HTMLElement, x: number, y: number) {
  const flow = slot.dataset.skcFlow as "column" | "row" | "grid"
  const kids = Array.from(slot.children).filter((el): el is HTMLElement => (el as HTMLElement).dataset.skcNode !== undefined)
  const box = slot.getBoundingClientRect()
  if (kids.length === 0) return { index: 0, empty: true, line: { x: box.left + 2, y: box.top + 2, w: box.width - 4, h: Math.max(box.height - 4, 24) }, kids }
  let index = kids.length
  for (let i = 0; i < kids.length; i++) {
    const r = kids[i].getBoundingClientRect()
    const before = flow === "column" ? y < r.top + r.height / 2 : y < r.top || (y <= r.bottom && x < r.left + r.width / 2)
    if (before) {
      index = i
      break
    }
  }
  const last = kids[kids.length - 1].getBoundingClientRect()
  if (flow === "column") {
    const next = kids[index]?.getBoundingClientRect()
    const prev = index > 0 ? kids[index - 1].getBoundingClientRect() : null
    const lineY = !next ? last.bottom + 4 : prev ? (prev.bottom + next.top) / 2 : next.top - 4
    return { index, empty: false, line: { x: box.left, y: lineY - 1.5, w: box.width, h: 3 }, kids }
  }
  const ref = (kids[index] ?? kids[kids.length - 1]).getBoundingClientRect()
  const prev = index > 0 && kids[index] ? kids[index - 1].getBoundingClientRect() : null
  const sameLine = prev && Math.abs(prev.top - ref.top) < 4
  const lineX = !kids[index] ? last.right + 4 : sameLine && prev ? (prev.right + ref.left) / 2 : ref.left - 4
  return { index, empty: false, line: { x: lineX - 1.5, y: ref.top, w: 3, h: ref.height }, kids }
}

/** Find the innermost container under the pointer that can take the payload. */
function hitTest(x: number, y: number, payload: DragPayload, labelOf: (id: string) => string): DropTarget | null {
  const dragged = payload.kind === "move" ? document.querySelector<HTMLElement>(`[data-skc-node="${payload.id}"]`) : null
  for (const el of document.elementsFromPoint(x, y)) {
    let slot = el.closest<HTMLElement>("[data-skc-slot]")
    while (slot && dragged?.contains(slot)) slot = slot.parentElement?.closest<HTMLElement>("[data-skc-slot]") ?? null
    if (!slot) continue
    const m = measure(slot, x, y)
    // Dropping a node right where it already is does nothing: show nothing.
    if (dragged && dragged.parentElement === slot) {
      const from = m.kids.indexOf(dragged)
      if (m.index === from || m.index === from + 1) return null
    }
    const owner = slot.closest<HTMLElement>("[data-skc-node]")
    const parentId = slot.dataset.skcSlot!
    return {
      parentId,
      index: m.index,
      line: m.line,
      empty: m.empty,
      box: toRect((owner ?? slot).getBoundingClientRect()),
      label: labelOf(parentId),
    }
  }
  return null
}

export function DragProvider({
  children,
  onDrop,
  labelOf,
  scroller,
  edgePan,
}: {
  children: ReactNode
  onDrop: (payload: DragPayload, target: DropTarget) => string | void
  labelOf: (id: string) => string
  scroller: React.RefObject<HTMLElement | null>
  /** Pans the view by (dx, dy) screen pixels when the pointer rests near an edge. */
  edgePan: (dx: number, dy: number) => void
}) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [landed, setLanded] = useState<string | null>(null)
  const live = useRef<{ payload: DragPayload; sx: number; sy: number; x: number; y: number; active: boolean } | null>(null)
  const frame = useRef(0)
  const scrollLoop = useRef(0)
  const cbs = useRef({ onDrop, labelOf, edgePan })
  cbs.current = { onDrop, labelOf, edgePan }

  const update = useCallback(() => {
    frame.current = 0
    const l = live.current
    if (!l?.active) return
    setDrag({ payload: l.payload, x: l.x, y: l.y, target: hitTest(l.x, l.y, l.payload, cbs.current.labelOf) })
  }, [])

  // Scroll the canvas while the pointer rests near its top or bottom edge.
  const autoScroll = useCallback(() => {
    const l = live.current
    const el = scroller.current
    if (!l?.active || !el) {
      scrollLoop.current = 0
      return
    }
    const r = el.getBoundingClientRect()
    const inside = l.x > r.left && l.x < r.right && l.y > r.top && l.y < r.bottom
    const dy = l.y < r.top + EDGE ? -(r.top + EDGE - l.y) : l.y > r.bottom - EDGE ? l.y - (r.bottom - EDGE) : 0
    const dx = l.x < r.left + EDGE ? -(r.left + EDGE - l.x) : l.x > r.right - EDGE ? l.x - (r.right - EDGE) : 0
    if (inside && (dx || dy)) {
      const speed = (v: number) => -Math.sign(v) * Math.min(18, Math.abs(v) * 0.3)
      cbs.current.edgePan(dx ? speed(dx) : 0, dy ? speed(dy) : 0)
      if (!frame.current) frame.current = requestAnimationFrame(update)
    }
    scrollLoop.current = requestAnimationFrame(autoScroll)
  }, [scroller, update])

  const end = useCallback(
    (commit: boolean) => {
      const l = live.current
      live.current = null
      cancelAnimationFrame(frame.current)
      cancelAnimationFrame(scrollLoop.current)
      frame.current = 0
      document.documentElement.removeAttribute("data-skc-dragging")
      if (l?.active) {
        // The pointerup that ends a drag must not also click what is under it.
        const swallow = (e: MouseEvent) => {
          e.stopPropagation()
          e.preventDefault()
        }
        window.addEventListener("click", swallow, { capture: true, once: true })
        window.setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0)
        const target = commit ? hitTest(l.x, l.y, l.payload, cbs.current.labelOf) : null
        if (target) {
          const id = cbs.current.onDrop(l.payload, target)
          if (id) {
            setLanded(id)
            window.setTimeout(() => setLanded((x) => (x === id ? null : x)), 700)
          }
        }
      }
      setDrag(null)
    },
    [],
  )

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const l = live.current
      if (!l) return
      l.x = e.clientX
      l.y = e.clientY
      if (!l.active) {
        if (Math.hypot(l.x - l.sx, l.y - l.sy) < THRESHOLD) return
        l.active = true
        document.getSelection()?.removeAllRanges()
        document.documentElement.setAttribute("data-skc-dragging", "")
        scrollLoop.current = requestAnimationFrame(autoScroll)
      }
      e.preventDefault()
      if (!frame.current) frame.current = requestAnimationFrame(update)
    }
    const up = () => live.current && end(true)
    const cancel = () => live.current && end(false)
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && live.current?.active) {
        e.preventDefault()
        e.stopImmediatePropagation()
        end(false)
      }
    }
    window.addEventListener("pointermove", move, { passive: false })
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", cancel)
    window.addEventListener("keydown", key, true)
    window.addEventListener("blur", cancel)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", cancel)
      window.removeEventListener("keydown", key, true)
      window.removeEventListener("blur", cancel)
    }
  }, [autoScroll, end, update])

  const begin = useCallback((e: ReactPointerEvent, payload: DragPayload) => {
    if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return
    // Don't steal pointer-downs meant for fields in the inspector or inline editors.
    if ((e.target as HTMLElement).closest("input, textarea, select")) return
    e.stopPropagation()
    live.current = { payload, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, active: false }
  }, [])

  return <DragCtx.Provider value={{ drag, landed, begin }}>{children}</DragCtx.Provider>
}

/** The ghost under the cursor, the target outline and the insertion line. */
export function DragOverlay({ renderGhost }: { renderGhost: (payload: DragPayload) => ReactNode }) {
  const { drag } = useDrag()
  if (!drag) return null
  const t = drag.target
  const ease = "cubic-bezier(.32,.72,0,1)"
  return (
    <div className="pointer-events-none fixed inset-0 z-[2147483646]">
      {t && (
        <div
          className="absolute top-0 left-0 rounded-[8px]"
          style={{
            transform: `translate3d(${t.box.x - 3}px, ${t.box.y - 3}px, 0)`,
            width: t.box.w + 6,
            height: t.box.h + 6,
            boxShadow: `0 0 0 1px ${ACCENT}55`,
            background: `${ACCENT}08`,
            transition: `transform .14s ${ease}, width .14s ${ease}, height .14s ${ease}`,
          }}
        />
      )}
      {t && (
        <div
          className="absolute top-0 left-0"
          style={{
            transform: `translate3d(${t.line.x}px, ${t.line.y}px, 0)`,
            width: t.line.w,
            height: t.line.h,
            borderRadius: t.empty ? 8 : 999,
            background: t.empty ? `${ACCENT}12` : ACCENT,
            outline: t.empty ? `1.5px dashed ${ACCENT}` : undefined,
            outlineOffset: -1.5,
            boxShadow: t.empty ? undefined : `0 0 0 3px ${ACCENT}26`,
            transition: `transform .12s ${ease}, width .12s ${ease}, height .12s ${ease}`,
          }}
        >
          {t.empty && (
            <span className="absolute inset-0 flex items-center justify-center font-sans text-[11px] font-medium" style={{ color: ACCENT }}>
              Drop into {t.label}
            </span>
          )}
        </div>
      )}
      <div className="absolute top-0 left-0" style={{ transform: `translate3d(${drag.x + 12}px, ${drag.y + 10}px, 0)` }}>
        <div className="skc-ghost">
          {renderGhost(drag.payload)}
          <span className="skc-ghost-where" data-off={t ? undefined : ""}>
            {t ? `in ${t.label}` : "Not here"}
          </span>
        </div>
      </div>
    </div>
  )
}
