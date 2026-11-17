import { Braces, Check, ChevronRight, Copy, Keyboard, LayoutTemplate, Palette, Monitor, Pencil, Play, Plus, Redo2, RotateCcw, Search, Smartphone, Undo2, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas } from "./canvas"
import { ACCENT, ChromeStyle, IconButton, IconSwap, Segmented, Tip, Toaster, plain, toast, useScrollbars } from "./chrome"
import type { Command } from "./commands"
import { CommandMenu, ShortcutSheet } from "./commands"
import type { Built } from "./gallery"
import { TemplateGallery } from "./gallery"
import { TEMPLATES } from "./templates"
import { PRESETS, themeVars } from "./theme"
import { ThemePanel } from "./theme-panel"
import type { DragPayload, DropTarget } from "./drag"
import { DragOverlay, DragProvider, useDrag } from "./drag"
import type { SketchNode } from "./format"
import { findNode, findParent, insertNode, mapNode, moveNode, walk } from "./format"
import { iconFor } from "./icons"
import type { BlockSpec } from "./blocks"
import { BLOCKS, blockById, buildBlock } from "./blocks"
import { BlockList } from "./block-list"
import { Inspector } from "./inspector"
import { CATEGORIES, KIT, PARTS, createNode } from "./kit"
import { toJSON, toPrompt } from "./output"
import { useSketchStore } from "./store"
import { contentTarget, placeBlock, redirectDrop, regionOfGroup } from "./regions"


export type SketchProps = {
  /** Open the canvas on first render. */
  defaultOpen?: boolean
  /** Key that toggles the canvas. */
  hotkey?: string
  /** Where ui components live, as in components.json. */
  uiAlias?: string
  /** Called with the prompt whenever it is copied. */
  onCopy?: (prompt: string) => void
}

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/** Sketch screens with your shadcn components and hand them to your agent. */
export function Sketch({ defaultOpen = false, hotkey = "s", uiAlias = "@/components/ui", onCopy }: SketchProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)
  const [menu, setMenu] = useState<"commands" | "shortcuts" | "templates" | null>(null)
  const [galleryPick, setGalleryPick] = useState<string | undefined>(undefined)
  const [themeOpen, setThemeOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [library, setLibraryState] = useState<"parts" | "blocks">(() => {
    try {
      return localStorage.getItem("sketchcn:library") === "blocks" ? "blocks" : "parts"
    } catch {
      return "parts"
    }
  })
  const setLibrary = (v: "parts" | "blocks") => {
    setLibraryState(v)
    try {
      localStorage.setItem("sketchcn:library", v)
    } catch {
      // Convenience only.
    }
  }
  // Close with a short exit animation, then unmount.
  const close = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      setOpen(false)
    }, 170)
  }
  const [renaming, setRenaming] = useState<string | null>(null)
  const [filter, setFilter] = useState("")
  const store = useSketchStore()
  const rootRef = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLElement>(null)
  const panRef = useRef<((dx: number, dy: number) => void) | null>(null)
  useScrollbars(rootRef, open)
  const copyTimer = useRef<number | undefined>(undefined)
  const { doc, screen, preview } = store

  const copy = async (kind: "prompt" | "json") => {
    const text = kind === "prompt" ? toPrompt(doc, { uiAlias }) : toJSON(doc)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard blocked (e.g. insecure context); the callback still fires.
    }
    if (kind === "prompt") {
      onCopy?.(text)
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600)
      toast(`Prompt copied · ${doc.screens.length} screen${doc.screens.length === 1 ? "" : "s"}`)
    } else toast("Sketch JSON copied")
  }

  const isContainer = (n: SketchNode) => !!KIT[n.type]?.container

  /** Puts a block where it belongs: sidebars and headers take their slot, content lands in the body. */
  const placeBlockSpec = (spec: BlockSpec, target?: { parentId: string; index: number }) => {
    const region = regionOfGroup(spec.group)
    const placed = placeBlock(screen.root, buildBlock(spec), region, { selectedId: store.selectedId, isContainer, target })
    const shell = region === "sidebar" ? "full" : screen.shell
    store.commit({ ...doc, screens: doc.screens.map((sc) => (sc.id === screen.id ? { ...sc, shell, root: placed.root } : sc)) })
    store.select(placed.id)
    if (region === "sidebar") toast(placed.swapped ? `Swapped in ${spec.name}` : `Added ${spec.name} as the screen's sidebar`, { label: "Undo", run: store.undo })
    else if (region === "header" && placed.swapped) toast(`Swapped in ${spec.name}`, { label: "Undo", run: store.undo })
    else toast(`Added ${spec.name}`)
    return placed.id
  }

  const addBlock = (spec: BlockSpec) => {
    store.setPreview(false)
    placeBlockSpec(spec)
  }

  const addPart = (type: string) => insertAtSelection(createNode(type))
  const insertAtSelection = (created: SketchNode) => {
    const t = contentTarget(screen.root, store.selectedId, isContainer)
    store.setRoot((r) => insertNode(r, t.parentId, t.index, created))
    store.select(created.id)
  }

  const onDrop = (payload: DragPayload, t: DropTarget) => {
    if (payload.kind === "block") {
      const spec = blockById(payload.id)
      if (!spec) return
      return placeBlockSpec(spec, { parentId: t.parentId, index: t.index })
    }
    const to = redirectDrop(screen.root, t.parentId, t.index)
    if (payload.kind === "new") {
      const created = createNode(payload.type)
      store.setRoot((r) => insertNode(r, to.parentId, to.index, created))
      store.select(created.id)
      return created.id
    }
    store.setRoot((r) => moveNode(r, payload.id, to.parentId, to.index))
    store.select(payload.id)
    return payload.id
  }
  const labelOf = (id: string) => {
    if (id === screen.root.id) return screen.name
    const n = findNode(screen.root, id)
    return n ? (KIT[n.type]?.label ?? n.type) : ""
  }

  const openTemplates = (id?: string) => {
    setGalleryPick(id)
    setMenu("templates")
  }
  const insertTemplate = (built: Built, mode: "add" | "replace") => {
    setMenu(null)
    store.setPreview(false)
    store.insertTemplate(built, mode)
    const n = built.screens.length
    toast(mode === "replace" ? `Started from a template · ${n} screens` : `Added ${n} screens`, { label: "Undo", run: store.undo })
  }

  const remove = (id: string) => {
    const node = store.remove(id)
    if (node) toast(`Deleted ${KIT[node.type]?.label ?? node.type}`, { label: "Undo", run: store.undo })
  }

  const order = useMemo(() => {
    const out: SketchNode[] = []
    walk(screen.root, (n) => n.id !== screen.root.id && out.push(n))
    return out
  }, [screen.root])

  const commands = useMemo<Command[]>(
    () => [
      { id: "copy", group: "Actions", label: "Copy prompt", icon: Copy, keys: "C", terms: "agent claude export", run: () => void copy("prompt") },
      { id: "preview", group: "Actions", label: preview ? "Back to editing" : "Preview the flow", icon: preview ? Pencil : Play, keys: "P", run: () => store.setPreview(!preview) },
      { id: "screen", group: "Actions", label: "New screen", icon: Plus, terms: "page add", run: () => store.addScreen() },
      { id: "theme", group: "Actions", label: "Theme…", icon: Palette, terms: "colors font radius dark mode", run: () => setThemeOpen(true) },
      ...PRESETS.map((p) => ({
        id: `theme:${p.id}`,
        group: "Themes",
        label: `Theme: ${p.name}`,
        icon: Palette,
        terms: `${p.theme.base ?? ""} ${p.theme.accent ?? ""} ${p.theme.font ?? ""}`,
        run: () => store.setTheme(p.id === "project" ? undefined : { ...p.theme }),
      })),
      { id: "templates", group: "Actions", label: "Templates…", icon: LayoutTemplate, keys: "T", terms: "preset block starter", run: () => openTemplates() },
      ...TEMPLATES.map((t) => ({
        id: `tpl:${t.id}`,
        group: "Templates",
        label: `${t.name} template`,
        icon: LayoutTemplate,
        terms: `${t.description} preset block`,
        run: () => openTemplates(t.id),
      })),
      {
        id: "device",
        group: "Actions",
        label: screen.device === "desktop" ? "Switch to mobile" : "Switch to desktop",
        icon: screen.device === "desktop" ? Smartphone : Monitor,
        terms: "device phone desktop",
        run: () => store.updateScreen({ device: screen.device === "desktop" ? "mobile" : "desktop" }),
      },
      { id: "json", group: "Actions", label: "Copy Sketch JSON", icon: Braces, terms: "export format", run: () => void copy("json") },
      { id: "shortcuts", group: "Actions", label: "Keyboard shortcuts", icon: Keyboard, keys: "?", run: () => setMenu("shortcuts") },
      {
        id: "reset",
        group: "Actions",
        label: "Reset to the example sketch",
        icon: RotateCcw,
        terms: "clear start over",
        run: () => {
          store.reset()
          toast("Sketch reset", { label: "Undo", run: store.undo })
        },
      },
      ...doc.screens.map((s, i) => ({
        id: `go:${s.id}`,
        group: "Screens",
        label: `Go to ${s.name}`,
        icon: s.device === "mobile" ? Smartphone : Monitor,
        keys: i < 9 ? String(i + 1) : undefined,
        terms: s.path,
        run: () => store.setScreen(s.id),
      })),
      ...BLOCKS.map((b) => ({
        id: `block:${b.id}`,
        group: "Blocks",
        label: `Insert ${b.name}`,
        icon: LayoutTemplate,
        terms: `${b.group} ${b.description}`,
        run: () => addBlock(b),
      })),
      ...PARTS.map((p) => ({
        id: `add:${p.type}`,
        group: "Add",
        label: `Add ${p.label}`,
        icon: iconFor(p.type),
        terms: `${p.category} ${p.terms ?? ""}`,
        run: () => {
          store.setPreview(false)
          addPart(p.type)
        },
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc, screen, preview, store.selectedId],
  )

  // Keyboard: the canvas should feel like a design tool.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (!open) {
        if (!typing(e.target) && !mod && !e.altKey && key === hotkey) {
          e.preventDefault()
          setOpen(true)
        }
        return
      }
      if (mod && key === "k") {
        e.preventDefault()
        setMenu((m) => (m === "commands" ? null : "commands"))
        return
      }
      if (menu || themeOpen || typing(e.target) || renaming) return

      const sel = store.selectedId
      if (mod && key === "z") {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
      } else if (mod && key === "d" && sel) {
        e.preventDefault()
        store.duplicate(sel)
      } else if (mod) {
        return
      } else if (e.altKey && sel && /^Key[AHDWVS]$/.test(e.code)) {
        // Figma's align keys: ⌥A ⌥H ⌥D across, ⌥W ⌥V ⌥S down.
        e.preventDefault()
        const align = ({ KeyA: "start", KeyH: "center", KeyD: "end", KeyW: "start", KeyV: "center", KeyS: "end" } as const)[e.code as "KeyA"]
        const node = findNode(screen.root, sel)
        store.setRoot((r) => mapNode(r, sel, (n) => ({ ...n, align: node?.align === align ? undefined : align })))
      } else if ((e.key === "Backspace" || e.key === "Delete") && sel) {
        e.preventDefault()
        remove(sel)
      } else if (e.key === "Escape") {
        e.preventDefault()
        if (preview) store.setPreview(false)
        else if (sel) {
          const loc = findParent(screen.root, sel)
          store.select(loc && loc.parent.id !== screen.root.id ? loc.parent.id : null)
        } else close()
      } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !preview) {
        e.preventDefault()
        const up = e.key === "ArrowUp"
        if (e.shiftKey && sel) {
          const loc = findParent(screen.root, sel)
          if (loc) store.setRoot((r) => moveNode(r, sel, loc.parent.id, loc.index + (up ? -1 : 2)))
          return
        }
        const at = sel ? order.findIndex((n) => n.id === sel) : -1
        const next = order[at === -1 ? (up ? order.length - 1 : 0) : Math.max(0, Math.min(order.length - 1, at + (up ? -1 : 1)))]
        if (next) store.select(next.id)
      } else if (e.key === "Enter" && sel) {
        const node = findNode(screen.root, sel)
        if (node?.children?.length) {
          e.preventDefault()
          store.select(node.children[0].id)
        }
      } else if (e.key === "?") {
        setMenu("shortcuts")
      } else if (key === "t") {
        openTemplates()
      } else if (key === "p") {
        store.setPreview(!preview)
      } else if (key === "c") {
        void copy("prompt")
      } else if (key === hotkey) {
        close()
      } else if (/^[1-9]$/.test(e.key)) {
        const s = doc.screens[Number(e.key) - 1]
        if (s) store.setScreen(s.id)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (!open) {
    return (
      <div className="skc">
        <ChromeStyle />
        <div className="fixed right-5 bottom-5 z-[2147483000]">
          <Tip label="Sketch a screen" keys={hotkey.toUpperCase()} side="left">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open sketchcn"
              className="skc-launcher flex size-11 items-center justify-center rounded-full bg-(--skc-tip) text-(--skc-tip-fg) shadow-[0_8px_24px_-6px_rgba(0,0,0,.35),0_0_0_.5px_rgba(0,0,0,.2)] transition-transform duration-200 hover:scale-[1.06] active:scale-95"
            >
              <Mark />
            </button>
          </Tip>
        </div>
      </div>
    )
  }

  const tabs = (
    <nav aria-label="Screens" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)] pr-6">
      {doc.screens.map((s, i) =>
        renaming === s.id ? (
          <RenameField
            key={s.id}
            value={s.name}
            onDone={(name) => {
              setRenaming(null)
              if (name && name !== s.name) store.patchScreen(s.id, { name })
            }}
          />
        ) : (
          <Tip key={s.id} label={s.path} keys={i < 9 ? String(i + 1) : undefined}>
            <button
              type="button"
              aria-pressed={s.id === screen.id}
              onClick={() => store.setScreen(s.id)}
              onDoubleClick={() => setRenaming(s.id)}
              className={`h-7 max-w-40 shrink-0 truncate rounded-md px-2 text-[12px] ${s.id === screen.id ? "bg-(--skc-active) font-medium" : "text-(--skc-muted) hover:text-(--skc-fg)"}`}
            >
              {s.name}
            </button>
          </Tip>
        ),
      )}
      <IconButton label="New screen" onClick={() => store.addScreen()}>
        <Plus />
      </IconButton>
      <IconButton label="Templates" keys="T" onClick={() => openTemplates()}>
        <LayoutTemplate />
      </IconButton>
    </nav>
  )

  return (
    <DragProvider onDrop={onDrop} labelOf={labelOf} scroller={scroller} edgePan={(dx, dy) => panRef.current?.(dx, dy)}>
    <div ref={rootRef} className={`skc fixed inset-0 z-[2147483000] flex flex-col bg-(--skc-bg) ${closing ? "skc-closing" : "skc-open"}`}>
      <ChromeStyle />

      {/* Top bar */}
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-(--skc-border) px-1.5">
        {tabs}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <IconButton label="Undo" keys="⌘Z" onClick={store.undo} disabled={store.past.length === 0}>
            <Undo2 />
          </IconButton>
          <IconButton label="Redo" keys="⇧⌘Z" onClick={store.redo} disabled={store.future.length === 0}>
            <Redo2 />
          </IconButton>
          <div className="mx-1.5 h-4 w-px bg-(--skc-border)" />
          <div className="w-[60px]">
            <Segmented<"desktop" | "mobile">
              value={screen.device}
              onChange={(device) => store.updateScreen({ device })}
              options={[
                { value: "desktop", label: "Desktop", icon: <Monitor /> },
                { value: "mobile", label: "Mobile", icon: <Smartphone /> },
              ]}
            />
          </div>
          <div className="relative ml-1">
            <Tip label="Theme">
              <button
                type="button"
                data-theme-trigger=""
                aria-label="Theme"
                aria-pressed={themeOpen}
                onClick={() => setThemeOpen((o) => !o)}
                className={`flex size-7 items-center justify-center rounded-md ${themeOpen ? "bg-(--skc-active)" : "hover:bg-(--skc-hover)"}`}
              >
                <span
                  className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)] transition-[background] duration-300"
                  style={{ background: themeVars(doc.theme, "light").primary ?? "conic-gradient(#f43f5e, #f59e0b, #10b981, #3b82f6, #8b5cf6, #f43f5e)" }}
                />
              </button>
            </Tip>
            {themeOpen && <ThemePanel theme={doc.theme} onChange={(t, merge) => store.setTheme(t, merge)} onClose={() => setThemeOpen(false)} />}
          </div>
          <IconButton label={preview ? "Back to editing" : "Preview the flow"} keys="P" active={preview} onClick={() => store.setPreview(!preview)}>
            <IconSwap on={preview} a={<Play />} b={<Pencil />} />
          </IconButton>
          <div className="mx-1.5 h-4 w-px bg-(--skc-border)" />
          <Tip label="Copy prompt for your agent" keys="C">
            <button
              type="button"
              onClick={() => copy("prompt")}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium whitespace-nowrap text-white shadow-[0_1px_2px_rgba(0,0,0,.12),inset_0_1px_0_rgba(255,255,255,.12)] hover:brightness-110 [&_svg]:size-3.5"
              style={{ background: ACCENT }}
            >
              <IconSwap on={copied} a={<Copy />} b={<Check />} />
              <span className="grid">
                {/* Both labels share one cell so the button never changes width. */}
                <span className="col-start-1 row-start-1 transition-opacity duration-150" style={{ opacity: copied ? 0 : 1 }}>
                  Copy prompt
                </span>
                <span className="col-start-1 row-start-1 text-center transition-opacity duration-150" style={{ opacity: copied ? 1 : 0 }}>
                  Copied
                </span>
              </span>
            </button>
          </Tip>
          <IconButton label="Close" keys="Esc" onClick={close}>
            <X />
          </IconButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Components */}
        {!preview && (
          <aside className="flex w-56 shrink-0 flex-col border-r border-(--skc-border)">
            <div className="px-2.5 pt-2.5">
              <Segmented<"parts" | "blocks">
                value={library}
                onChange={setLibrary}
                options={[
                  { value: "parts", label: "Parts" },
                  { value: "blocks", label: "Blocks" },
                ]}
              />
            </div>
            {library === "parts" ? (
              <ComponentList filter={filter} setFilter={setFilter} onAdd={addPart} selected={!!store.selectedId} />
            ) : (
              <BlockList onAdd={addBlock} theme={doc.theme} />
            )}
          </aside>
        )}

        {/* Canvas */}
        <main ref={scroller} className="relative min-w-0 flex-1 overflow-hidden bg-(--skc-canvas)">
          <Canvas store={store} panRef={panRef} />
          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            <IconButton label="Search" keys="⌘K" side="top" className="bg-(--skc-popover) shadow-[0_0_0_1px_var(--skc-border)]" onClick={() => setMenu("commands")}>
              <Search />
            </IconButton>
            <IconButton label="Shortcuts" keys="?" side="top" className="bg-(--skc-popover) shadow-[0_0_0_1px_var(--skc-border)]" onClick={() => setMenu("shortcuts")}>
              <Keyboard />
            </IconButton>
          </div>
          {preview && (
            <div className="skc-toast pointer-events-none absolute bottom-4 left-1/2 flex h-8 -translate-x-1/2 items-center gap-2 rounded-full bg-(--skc-tip) px-3.5 text-[12px] whitespace-nowrap text-(--skc-tip-fg) shadow-[0_8px_24px_-6px_rgba(0,0,0,.35)]">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Previewing · click linked elements · <span className="opacity-60">Esc to edit</span>
            </div>
          )}
        </main>

        {/* Inspector */}
        {!preview && (
          <aside className="skc-scroll w-64 shrink-0 overflow-y-auto border-l border-(--skc-border)">
            <Inspector store={store} onDelete={remove} />
          </aside>
        )}
      </div>

      {menu === "commands" && <CommandMenu commands={commands} onClose={() => setMenu(null)} />}
      {menu === "shortcuts" && <ShortcutSheet onClose={() => setMenu(null)} />}
      {menu === "templates" && <TemplateGallery initial={galleryPick} theme={doc.theme} onClose={() => setMenu(null)} onInsert={insertTemplate} />}
      <Toaster />
      <DragOverlay
        renderGhost={(p) => {
          if (p.kind === "block")
            return (
              <>
                <LayoutTemplate strokeWidth={1.75} />
                {p.name}
              </>
            )
          const Icon = iconFor(p.type)
          return (
            <>
              <Icon strokeWidth={1.75} />
              {KIT[p.type]?.label ?? p.type}
            </>
          )
        }}
      />
    </div>
    </DragProvider>
  )
}

const OPEN_KEY = "sketchcn:groups"
function readClosed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) ?? "[]") as string[]
  } catch {
    return []
  }
}

/** The component list: grouped, collapsible (remembered), searchable, drag or click to add. */
function ComponentList({ filter, setFilter, onAdd, selected }: { filter: string; setFilter: (v: string) => void; onAdd: (type: string) => void; selected: boolean }) {
  const { begin } = useDrag()
  const [closed, setClosed] = useState<string[]>(readClosed)
  const q = filter.trim().toLowerCase()
  const shown = PARTS.filter((p) => !q || `${p.label} ${p.category} ${p.terms ?? ""}`.toLowerCase().includes(q))
  const toggle = (cat: string) =>
    setClosed((c) => {
      const next = c.includes(cat) ? c.filter((x) => x !== cat) : [...c, cat]
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next))
      } catch {
        // Remembering is a convenience; ignore blocked storage.
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
              onAdd(shown[0].type)
              setFilter("")
              e.currentTarget.blur()
            } else if (e.key === "Escape") {
              setFilter("")
              e.currentTarget.blur()
            }
          }}
          placeholder={`Search ${PARTS.length} components`}
          aria-label="Filter components"
          className="h-7 w-full bg-transparent pl-5 text-[13px] outline-none placeholder:text-(--skc-faint)"
          {...plain}
        />
      </div>
      <div className="skc-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {CATEGORIES.map((cat) => {
          const items = shown.filter((p) => p.category === cat)
          if (!items.length) return null
          const open = !!q || !closed.includes(cat)
          return (
            <div key={cat} className="pb-1">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(cat)}
                className="group/cat flex h-7 w-full items-center gap-1 rounded-md px-2 text-[11px] text-(--skc-muted) hover:text-(--skc-fg)"
              >
                <ChevronRight className={`size-3 transition-transform duration-150 ${open ? "rotate-90" : ""}`} />
                {cat === "AI" ? (
                  <span className="flex items-center gap-1.5">
                    AI
                    <span className="rounded-full px-1.5 py-px text-[9.5px] font-semibold tracking-wide text-white" style={{ background: ACCENT }}>
                      NEW
                    </span>
                  </span>
                ) : (
                  cat
                )}
                <span className="ml-auto text-(--skc-faint) tabular-nums opacity-0 group-hover/cat:opacity-100">{items.length}</span>
              </button>
              {open &&
                items.map((p) => {
                  const Icon = iconFor(p.type)
                  return (
                    <div
                      key={p.type}
                      role="button"
                      tabIndex={0}
                      title={`Drag onto the canvas, or click to add${selected ? " after the selection" : ""}`}
                      onPointerDown={(e) => begin(e, { kind: "new", type: p.type })}
                      onClick={() => onAdd(p.type)}
                      onKeyDown={(e) => e.key === "Enter" && onAdd(p.type)}
                      className="flex h-8 touch-none items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors duration-150 select-none hover:bg-(--skc-hover)"
                    >
                      <Icon className="size-4 shrink-0 text-(--skc-muted)" strokeWidth={1.75} />
                      <span className="truncate">{p.label}</span>
                    </div>
                  )
                })}
            </div>
          )
        })}
        {shown.length === 0 && <p className="px-2 py-6 text-center text-(--skc-muted)">Nothing for «{filter}».</p>}
      </div>
    </>
  )
}

/** Inline rename: Enter or blur saves, Esc cancels. */
function RenameField({ value, onDone }: { value: string; onDone: (v: string | null) => void }) {
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
        if (e.key === "Enter") finish(v.trim() || null)
        if (e.key === "Escape") finish(null)
      }}
      aria-label="Screen name"
      className="h-7 w-32 shrink-0 rounded-md border border-(--skc-accent) bg-(--skc-field) px-2 text-[12px] outline-none"
      {...plain}
    />
  )
}

/** The mark: a pencil stroke across a component box. */
function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1.5" y="3.5" width="15" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 11.5 L13.5 6.5" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
