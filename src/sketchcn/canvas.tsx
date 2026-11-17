import { Maximize, Minus, Plus } from "lucide-react"
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { ACCENT, Tip } from "./chrome"
import { useDrag } from "./drag"
import { loadFont, themeStyle } from "./theme"
import type { Flow, SketchNode } from "./format"
import { alignClass, fillClass } from "./format"
import { KIT } from "./kit"
import { uid } from "./format"
import type { SketchStore } from "./store"
import { Button } from "@/components/ui/button"

type Ctx = {
  store: SketchStore
  hovered: string | null
  setHovered: (id: string | null) => void
  /** Current zoom, so on-canvas chrome can stay a constant size. */
  zoom: number
}

const CanvasCtx = createContext<Ctx | null>(null)
const useCanvas = () => {
  const ctx = useContext(CanvasCtx)
  if (!ctx) throw new Error("useCanvas outside <Canvas>")
  return ctx
}

type View = { x: number; y: number; z: number }
const MIN_Z = 0.1
const MAX_Z = 4
const clampZ = (z: number) => Math.min(MAX_Z, Math.max(MIN_Z, z))
const typingIn = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/**
 * An infinite canvas: the frame sits in a world you pan and zoom.
 * Scroll or two-finger swipe pans, pinch or ⌘+scroll zooms at the cursor,
 * Space+drag, middle-drag or dragging empty canvas pans.
 */
export function Canvas({ store, panRef }: { store: SketchStore; panRef?: React.MutableRefObject<((dx: number, dy: number) => void) | null> }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const { screen } = store
  const mobile = screen.device === "mobile"
  const frameWidth = mobile ? 390 : 1280

  const font = store.doc.theme?.font
  useEffect(() => loadFont(font), [font])

  const vp = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [view, setViewState] = useState<View>({ x: 40, y: 40, z: 0.6 })
  const [animate, setAnimate] = useState(false)
  const [panning, setPanning] = useState(false)
  const [space, setSpace] = useState(false)
  const viewRef = useRef(view)
  // While true, the view refits when the viewport resizes (side panels opening, preview).
  const autoFit = useRef(true)

  const setView = useCallback((v: View, anim = false) => {
    viewRef.current = v
    setAnimate(anim)
    setViewState(v)
  }, [])

  const fit = useCallback(
    (anim = true) => {
      const el = vp.current
      if (!el) return
      const z = clampZ(Math.min(1, (el.clientWidth - 96) / frameWidth))
      setView({ x: (el.clientWidth - frameWidth * z) / 2, y: 40, z }, anim)
      autoFit.current = true
    },
    [frameWidth, setView],
  )

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number, anim = false) => {
      const el = vp.current
      if (!el) return
      const { x, y, z } = viewRef.current
      const nz = clampZ(z * factor)
      const px = cx ?? el.clientWidth / 2
      const py = cy ?? el.clientHeight / 2
      setView({ x: px - ((px - x) * nz) / z, y: py - ((py - y) * nz) / z, z: nz }, anim)
      autoFit.current = false
    },
    [setView],
  )

  const pan = useCallback(
    (dx: number, dy: number) => {
      const { x, y, z } = viewRef.current
      setView({ x: x + dx, y: y + dy, z })
      autoFit.current = false
    },
    [setView],
  )
  if (panRef) panRef.current = pan

  // Fit when the screen or device changes, and keep fitting on resize until the user moves.
  useLayoutEffect(() => fit(false), [fit, screen.id])
  useEffect(() => {
    const el = vp.current
    if (!el) return
    const ro = new ResizeObserver(() => autoFit.current && fit(false))
    ro.observe(el)
    const onResize = () => autoFit.current && fit(false)
    window.addEventListener("resize", onResize)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", onResize)
    }
  }, [fit, store.preview])

  // Wheel: pan by default, zoom with ⌘/Ctrl (trackpad pinch arrives as Ctrl+wheel).
  useEffect(() => {
    const el = vp.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1
      const r = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * unit * 0.0125), e.clientX - r.left, e.clientY - r.top)
      else pan(-e.deltaX * unit, -e.deltaY * unit)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [pan, zoomAt])

  // Keys: Space to grab, ⇧1 fit, ⇧0 100%, ⌘+/⌘− zoom.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (typingIn(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        setSpace(true)
      } else if (e.shiftKey && e.code === "Digit1") {
        e.preventDefault()
        fit()
      } else if (e.shiftKey && e.code === "Digit0") {
        e.preventDefault()
        zoomAt(1 / viewRef.current.z, undefined, undefined, true)
      } else if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault()
        zoomAt(1.25, undefined, undefined, true)
      } else if (mod && e.key === "-") {
        e.preventDefault()
        zoomAt(0.8, undefined, undefined, true)
      }
    }
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpace(false)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", () => setSpace(false))
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [fit, zoomAt])

  // Pointer panning: Space+drag or middle button anywhere, left drag on empty canvas.
  const onPointerDownCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    const onEmpty = !frameRef.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest("[data-skc-zoom]")
    if (!(e.button === 1 || (e.button === 0 && (space || onEmpty)))) return
    e.preventDefault()
    e.stopPropagation()
    const start = { x: e.clientX, y: e.clientY, v: viewRef.current }
    let moved = false
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      if (!moved && Math.hypot(dx, dy) < 3) return
      if (!moved) setPanning(true)
      moved = true
      setView({ x: start.v.x + dx, y: start.v.y + dy, z: start.v.z })
      autoFit.current = false
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      setPanning(false)
      // A plain click on empty canvas clears the selection.
      if (!moved && onEmpty && !space) store.select(null)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const { x, y, z } = view
  const dot = 16 * z

  return (
    <CanvasCtx.Provider value={{ store, hovered, setHovered, zoom: z }}>
      <div
        ref={vp}
        className="absolute inset-0 touch-none overflow-hidden select-none"
        style={{
          cursor: panning ? "grabbing" : space ? "grab" : undefined,
          backgroundImage: "radial-gradient(var(--skc-dot) 1px, transparent 1px)",
          backgroundSize: `${dot}px ${dot}px`,
          backgroundPosition: `${x}px ${y}px`,
        }}
        onPointerDownCapture={onPointerDownCapture}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{
            transform: `translate3d(${x}px, ${y}px, 0) scale(${z})`,
            transition: animate ? "transform .28s cubic-bezier(.32,.72,0,1)" : undefined,
            pointerEvents: space || panning ? "none" : undefined,
          }}
          onTransitionEnd={() => setAnimate(false)}
        >
          <div
            ref={frameRef}
            className={`skc-frame ${mobile ? "skc-mobile" : ""} overflow-hidden rounded-xl border bg-background text-foreground ${store.doc.theme?.mode === "dark" ? "dark" : ""} shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_-8px_rgba(0,0,0,0.12)]`}
            style={{ ...themeStyle(store.doc.theme), width: frameWidth, minHeight: mobile ? 780 : 760 }}
            onMouseLeave={() => setHovered(null)}
          >
            <Shell>
              <NodeView node={screen.root} isRoot />
            </Shell>
          </div>
          <div className="pointer-events-none absolute -top-6 left-0 font-sans text-[12px] whitespace-nowrap text-(--skc-muted)" style={{ transform: `scale(${1 / z})`, transformOrigin: "bottom left" }}>
            {screen.name} <span className="opacity-60">{mobile ? "390" : "1280"}</span>
          </div>
        </div>

        <ZoomControls z={z} onOut={() => zoomAt(0.8, undefined, undefined, true)} onIn={() => zoomAt(1.25, undefined, undefined, true)} onFit={() => fit()} onActual={() => zoomAt(1 / z, undefined, undefined, true)} />
      </div>
    </CanvasCtx.Provider>
  )
}

function ZoomControls({ z, onIn, onOut, onFit, onActual }: { z: number; onIn: () => void; onOut: () => void; onFit: () => void; onActual: () => void }) {
  const btn = "flex h-6 min-w-6 items-center justify-center rounded-[5px] px-1 text-(--skc-muted) hover:bg-(--skc-hover) hover:text-(--skc-fg) [&_svg]:size-3.5"
  return (
    <div
      data-skc-zoom=""
      className="absolute right-3 bottom-3 flex items-center gap-0.5 rounded-lg border border-(--skc-border) bg-(--skc-popover) p-0.5 font-sans text-[12px] shadow-[0_4px_16px_-4px_rgba(0,0,0,.12)]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Tip label="Zoom out" keys="⌘−" side="top">
        <button type="button" className={btn} onClick={onOut} aria-label="Zoom out">
          <Minus />
        </button>
      </Tip>
      <Tip label="Zoom to 100%" keys="⇧0" side="top">
        <button type="button" className={`${btn} w-11 tabular-nums`} onClick={onActual}>
          {Math.round(z * 100)}%
        </button>
      </Tip>
      <Tip label="Zoom in" keys="⌘+" side="top">
        <button type="button" className={btn} onClick={onIn} aria-label="Zoom in">
          <Plus />
        </button>
      </Tip>
      <div className="mx-0.5 h-4 w-px bg-(--skc-border)" />
      <Tip label="Zoom to fit" keys="⇧1" side="top">
        <button type="button" className={btn} onClick={onFit} aria-label="Zoom to fit">
          <Maximize />
        </button>
      </Tip>
    </div>
  )
}

export const SHELL_ID = "@shell"

/** Inline text editor for nav labels and the app name: Enter or blur saves, Esc cancels. */
function InlineEdit({ value, onDone, className }: { value: string; onDone: (v: string | null) => void; className?: string }) {
  const [v, setV] = useState(value)
  const done = useRef(false)
  const finish = (out: string | null) => {
    if (done.current) return
    done.current = true
    onDone(out)
  }
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => finish(v.trim() || null)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === "Enter") finish(v.trim() || null)
        if (e.key === "Escape") finish(null)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={`min-w-0 rounded-sm bg-background px-1 outline-none ${className ?? ""}`}
      style={{ boxShadow: `0 0 0 1.5px ${ACCENT}` }}
      spellCheck={false}
      autoComplete="off"
    />
  )
}

/**
 * The app shell (sidebar or top bar) is editable like any part: click to select it,
 * double-click a nav item or the app name to rename, hover for "+ Add item".
 */
function Shell({ children }: { children: ReactNode }) {
  const { store, hovered, setHovered, zoom } = useCanvas()
  const { drag } = useDrag()
  const { screen, doc, preview } = store
  const [editing, setEditing] = useState<string | null>(null)
  const mobile = screen.device === "mobile"
  const pad = mobile ? "p-4" : "p-8"

  if (screen.shell === "full") return <main className="min-h-[inherit]">{children}</main>
  if (screen.shell === "none") return <main className={pad}>{children}</main>

  const selected = store.selectedId === SHELL_ID
  const isHovered = hovered === SHELL_ID && !preview && !drag
  const showChrome = !preview && !drag && (selected || isHovered)
  const nav = doc.app.nav
  const setApp = (patch: Partial<typeof doc.app>) => store.commit({ ...doc, app: { ...doc.app, ...patch } })
  const rename = (id: string, label: string | null) => {
    setEditing(null)
    if (label) setApp({ nav: nav.map((i) => (i.id === id ? { ...i, label } : i)) })
  }
  const addItem = () => {
    const id = uid()
    setApp({ nav: [...nav, { id, label: "New item" }] })
    store.select(SHELL_ID)
    setEditing(id)
  }

  const shellProps = {
    "data-skc-shell": "",
    onMouseOver: (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!preview && hovered !== SHELL_ID) setHovered(SHELL_ID)
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!preview) store.select(SHELL_ID)
    },
    style: {
      outline: showChrome ? `${(selected ? 1.5 : 1) / zoom}px solid ${ACCENT}${selected ? "" : "80"}` : undefined,
      outlineOffset: -1 / zoom,
    },
  }

  const label = showChrome && (
    <div
      className="pointer-events-none absolute top-1 right-1 z-10 flex origin-top-right items-center rounded-[3px] px-1 py-[2px] font-sans text-[10px] leading-none font-medium whitespace-nowrap text-white"
      style={{ background: ACCENT, transform: `scale(${1 / zoom})` }}
    >
      {screen.shell === "sidebar" && !mobile ? "Sidebar" : "Top bar"} · {nav.length} items
    </div>
  )

  const brand = (
    <div
      className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold"
      onDoubleClick={(e) => {
        if (preview) return
        e.stopPropagation()
        store.select(SHELL_ID)
        setEditing("@brand")
      }}
    >
      <div className="size-6 shrink-0 rounded-md bg-primary" />
      {editing === "@brand" ? (
        <InlineEdit
          value={doc.app.name}
          className="w-32 text-sm font-semibold"
          onDone={(v) => {
            setEditing(null)
            if (v) setApp({ name: v })
          }}
        />
      ) : (
        doc.app.name
      )}
    </div>
  )

  const item = (it: (typeof nav)[number], vertical: boolean) =>
    editing === it.id ? (
      <div key={it.id} className={vertical ? "px-1 py-1" : ""}>
        <InlineEdit value={it.label} className="h-7 w-full text-sm" onDone={(v) => rename(it.id, v)} />
      </div>
    ) : (
      <Button
        key={it.id}
        variant="ghost"
        size="sm"
        tabIndex={-1}
        onClick={(e) => {
          if (!preview) return
          e.stopPropagation()
          if (it.link) store.setScreen(it.link)
        }}
        onDoubleClick={(e) => {
          if (preview) return
          e.stopPropagation()
          store.select(SHELL_ID)
          setEditing(it.id)
        }}
        className={`${vertical ? "justify-start" : ""} ${
          it.link === screen.id ? (vertical ? "bg-sidebar-accent text-sidebar-accent-foreground" : "bg-accent") : vertical ? "" : "text-muted-foreground"
        } ${preview ? "" : "cursor-default hover:bg-transparent"}`}
      >
        {it.label}
      </Button>
    )

  const add = !preview && showChrome && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        addItem()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="flex h-8 items-center gap-1.5 rounded-md border border-dashed px-2 text-xs text-muted-foreground hover:text-foreground"
      style={{ borderColor: `${ACCENT}66` }}
    >
      <Plus className="size-3.5" /> Add item
    </button>
  )

  if (screen.shell === "sidebar" && !mobile) {
    return (
      <div className="flex min-h-[inherit]" style={{ minHeight: "inherit" }}>
        <aside {...shellProps} className="relative flex w-56 shrink-0 flex-col gap-1 border-r bg-sidebar p-3 text-sidebar-foreground">
          {label}
          <div className="mb-2">{brand}</div>
          {nav.map((it) => item(it, true))}
          {add}
        </aside>
        <main className={`min-w-0 flex-1 ${pad}`} onMouseOver={() => hovered === SHELL_ID && setHovered(null)}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div>
      <header {...shellProps} className={`relative flex h-14 items-center gap-6 border-b ${mobile ? "px-4" : "px-6"}`}>
        {label}
        {brand}
        {mobile ? (
          <div className="ml-auto flex flex-col gap-1">
            <span className="block h-0.5 w-5 rounded bg-foreground" />
            <span className="block h-0.5 w-5 rounded bg-foreground" />
            <span className="block h-0.5 w-5 rounded bg-foreground" />
          </div>
        ) : (
          <nav className="flex items-center gap-1">
            {nav.map((it) => item(it, false))}
            {add}
          </nav>
        )}
      </header>
      <main className={pad} onMouseOver={() => hovered === SHELL_ID && setHovered(null)}>
        {children}
      </main>
    </div>
  )
}

function NodeView({ node, isRoot = false, flow }: { node: SketchNode; isRoot?: boolean; flow?: Flow }) {
  const { store, hovered, setHovered, zoom } = useCanvas()
  const { drag, landed, begin } = useDrag()
  const { preview, selectedId, doc } = store
  const part = KIT[node.type]
  if (!part) return null

  const dragging = !!drag
  const selected = selectedId === node.id
  const isHovered = hovered === node.id && !preview && !dragging
  const linkTarget = node.link ? doc.screens.find((s) => s.id === node.link) : undefined
  const beingMoved = drag?.payload.kind === "move" && drag.payload.id === node.id

  let content: ReactNode
  if (part.container) {
    const empty = (node.children ?? []).length === 0
    const slot = (
      <div
        data-skc-slot={node.id}
        data-skc-flow={part.container.flow}
        className={`${part.container.slotClass(node.props)} ${empty && !preview ? "min-h-20 rounded-lg border border-dashed border-muted-foreground/25" : ""} ${isRoot ? "min-h-[560px]" : ""}`}
      >
        {(node.children ?? []).map((child) => (
          <NodeView key={child.id} node={child} flow={part.container?.flow} />
        ))}
        {empty && !preview && (
          <div className="pointer-events-none m-auto self-center text-xs text-muted-foreground/70">{isRoot ? "Drag components here" : "Empty"}</div>
        )}
      </div>
    )
    content = part.render(node.props, slot)
  } else {
    content = <div className={preview ? "" : "pointer-events-none"}>{part.render(node.props, null)}</div>
  }

  if (isRoot) return <>{content}</>

  const showChrome = !preview && !dragging && (selected || isHovered)

  return (
    <div
      data-skc-node={node.id}
      className={`relative ${flow === "row" ? "" : "min-w-0"} rounded-[6px] transition-opacity duration-150 ${fillClass(node)} ${alignClass(node.align, flow)} ${landed === node.id ? "skc-landed" : ""} ${preview && node.link ? "cursor-pointer" : ""}`}
      style={{
        opacity: beingMoved ? 0.3 : undefined,
        outline: showChrome || (selected && dragging && !beingMoved) ? `${(selected ? 1.5 : 1) / zoom}px solid ${ACCENT}${selected ? "" : "80"}` : undefined,
        outlineOffset: 1 / zoom,
      }}
      onPointerDown={preview ? undefined : (e) => begin(e, { kind: "move", id: node.id, type: node.type })}
      onMouseOver={(e) => {
        e.stopPropagation()
        if (!preview && hovered !== node.id) setHovered(node.id)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (preview) {
          if (node.link) store.setScreen(node.link)
          return
        }
        store.select(node.id)
      }}
    >
      {content}
      {showChrome && (
        <div
          className="pointer-events-none absolute bottom-full left-[-1px] z-10 mb-[3px] flex origin-bottom-left items-center gap-1 rounded-[3px] px-1 py-[2px] font-sans text-[10px] leading-none font-medium whitespace-nowrap text-white"
          style={{ background: ACCENT, transform: `scale(${1 / zoom})` }}
        >
          {part.label}
          {linkTarget && <span className="opacity-80">→ {linkTarget.name}</span>}
          {node.note && <span className="opacity-80">· note</span>}
        </div>
      )}
      {!showChrome && !preview && !dragging && (node.note || linkTarget) && (
        <div className="pointer-events-none absolute -top-1 -right-1 z-10 size-2 rounded-full" style={{ background: ACCENT, transform: `scale(${1 / zoom})` }} title={node.note} />
      )}
    </div>
  )
}
