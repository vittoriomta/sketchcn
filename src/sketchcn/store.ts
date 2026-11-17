import { useCallback, useEffect, useMemo, useReducer } from "react"
import type { NavItem, Screen, SketchDoc, SketchNode } from "./format"
import { cloneNode, findNode, findParent, insertNode, removeNode, uid } from "./format"
import { createNode } from "./kit"

const STORAGE_KEY = "sketchcn:v1"
const HISTORY_LIMIT = 100

type State = {
  past: SketchDoc[]
  doc: SketchDoc
  future: SketchDoc[]
  screenId: string
  selectedId: string | null
  preview: boolean
  /** Edits sharing a merge key within a second collapse into one undo step. */
  mergeKey: string | null
  mergeAt: number
}

type Action =
  | { type: "commit"; doc: SketchDoc; merge?: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "screen"; id: string }
  | { type: "select"; id: string | null }
  | { type: "preview"; on: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "commit": {
      if (action.doc === state.doc) return state
      const now = Date.now()
      const merging = !!action.merge && action.merge === state.mergeKey && now - state.mergeAt < 1000
      return {
        ...state,
        mergeKey: action.merge ?? null,
        mergeAt: now,
        past: merging ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
        doc: action.doc,
        future: [],
        screenId: action.doc.screens.some((s) => s.id === state.screenId)
          ? state.screenId
          : action.doc.screens[0].id,
      }
    }
    case "undo": {
      const prev = state.past.at(-1)
      if (!prev) return state
      return {
        ...state,
        mergeKey: null,
        past: state.past.slice(0, -1),
        doc: prev,
        future: [state.doc, ...state.future],
        screenId: prev.screens.some((s) => s.id === state.screenId) ? state.screenId : prev.screens[0].id,
      }
    }
    case "redo": {
      const next = state.future[0]
      if (!next) return state
      return {
        ...state,
        mergeKey: null,
        past: [...state.past, state.doc],
        doc: next,
        future: state.future.slice(1),
        screenId: next.screens.some((s) => s.id === state.screenId) ? state.screenId : next.screens[0].id,
      }
    }
    case "screen":
      return { ...state, screenId: action.id, selectedId: null }
    case "select":
      return { ...state, selectedId: action.id }
    case "preview":
      return { ...state, preview: action.on, selectedId: null }
  }
}

function load(): SketchDoc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const doc = JSON.parse(raw) as SketchDoc
      if (doc.version === 1 && doc.screens?.length) return doc
    }
  } catch {
    // Private mode or corrupted data: start fresh.
  }
  return starterDoc()
}

export function useSketchStore() {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const doc = load()
    return { past: [], doc, future: [], screenId: doc.screens[0].id, selectedId: null, preview: false, mergeKey: null, mergeAt: 0 }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.doc))
    } catch {
      // Storage full or blocked; the sketch still works in memory.
    }
  }, [state.doc])

  const screen = useMemo(
    () => state.doc.screens.find((s) => s.id === state.screenId) ?? state.doc.screens[0],
    [state.doc, state.screenId],
  )

  const commit = useCallback((doc: SketchDoc, merge?: string) => dispatch({ type: "commit", doc, merge }), [])

  /** Replace the current screen's root tree. */
  const setRoot = useCallback(
    (fn: (root: SketchNode) => SketchNode, merge?: string) => {
      commit(
        {
          ...state.doc,
          screens: state.doc.screens.map((s) => (s.id === screen.id ? { ...s, root: fn(s.root) } : s)),
        },
        merge,
      )
    },
    [commit, state.doc, screen.id],
  )

  const updateScreen = useCallback(
    (patch: Partial<Screen>, merge?: string) => {
      commit(
        {
          ...state.doc,
          screens: state.doc.screens.map((s) => (s.id === screen.id ? { ...s, ...patch } : s)),
        },
        merge,
      )
    },
    [commit, state.doc, screen.id],
  )

  const patchScreen = (id: string, patch: Partial<Screen>, merge?: string) =>
    commit({ ...state.doc, screens: state.doc.screens.map((s) => (s.id === id ? { ...s, ...patch } : s)) }, merge)

  /** Copy a node next to itself and select the copy. */
  const duplicate = (id: string) => {
    const node = findNode(screen.root, id)
    const loc = findParent(screen.root, id)
    if (!node || !loc) return
    const copy = cloneNode(node)
    setRoot((r) => insertNode(r, loc.parent.id, loc.index + 1, copy))
    dispatch({ type: "select", id: copy.id })
  }

  /** Remove a node; returns it so the caller can name it (e.g. in a toast). */
  const remove = (id: string) => {
    const node = findNode(screen.root, id)
    if (!node || id === screen.root.id) return null
    setRoot((r) => removeNode(r, id))
    dispatch({ type: "select", id: null })
    return node
  }

  const addScreen = () => {
    const s = blankScreen(`Screen ${state.doc.screens.length + 1}`, state.doc.screens.length + 1)
    commit({ ...state.doc, screens: [...state.doc.screens, s] })
    dispatch({ type: "screen", id: s.id })
    return s
  }

  /** Delete a screen and every link or nav item that pointed at it. */
  const removeScreen = (id: string) => {
    if (state.doc.screens.length < 2) return
    const strip = (n: SketchNode): SketchNode => ({ ...n, link: n.link === id ? undefined : n.link, children: n.children?.map(strip) })
    commit({
      ...state.doc,
      app: { ...state.doc.app, nav: state.doc.app.nav.map((i) => (i.link === id ? { ...i, link: undefined } : i)) },
      screens: state.doc.screens.filter((s) => s.id !== id).map((s) => ({ ...s, root: strip(s.root) })),
    })
  }

  /** Add a template's screens (merging its nav), or start over from it. */
  const insertTemplate = (built: { screens: Screen[]; nav: NavItem[]; app?: string }, mode: "add" | "replace") => {
    if (mode === "replace") {
      commit({ version: 1, app: { name: built.app ?? state.doc.app.name, nav: built.nav }, screens: built.screens })
    } else {
      const nav = [...state.doc.app.nav]
      for (const item of built.nav) {
        const same = nav.findIndex((i) => i.label.toLowerCase() === item.label.toLowerCase())
        if (same === -1) nav.push(item)
        else if (!nav[same].link) nav[same] = { ...nav[same], link: item.link }
      }
      commit({ ...state.doc, app: { ...state.doc.app, nav }, screens: [...state.doc.screens, ...built.screens] })
    }
    dispatch({ type: "screen", id: built.screens[0].id })
  }

  const setTheme = (theme: SketchDoc["theme"], merge?: string) => commit({ ...state.doc, theme }, merge)

  return {
    ...state,
    setTheme,
    insertTemplate,
    screen,
    commit,
    setRoot,
    updateScreen,
    patchScreen,
    duplicate,
    remove,
    addScreen,
    removeScreen,
    reset: () => commit(starterDoc()),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    setScreen: (id: string) => dispatch({ type: "screen", id }),
    select: (id: string | null) => dispatch({ type: "select", id }),
    setPreview: (on: boolean) => dispatch({ type: "preview", on }),
  }
}

export type SketchStore = ReturnType<typeof useSketchStore>

export function blankScreen(name: string, n: number): Screen {
  return {
    id: uid(),
    name,
    path: `/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `screen-${n}`}`,
    device: "desktop",
    shell: "none",
    root: { ...createNode("stack"), props: { gap: "lg" } },
  }
}

// A small two-screen sketch so the canvas never opens empty.
export function starterDoc(): SketchDoc {
  const n = (type: string, props: Record<string, string | number | boolean> = {}, children?: SketchNode[], extra: Partial<SketchNode> = {}): SketchNode => {
    const node = createNode(type)
    return { ...node, props: { ...node.props, ...props }, ...(children ? { children } : {}), ...extra }
  }
  const projects = uid()
  const detail = uid()
  return {
    version: 1,
    app: {
      name: "Acme",
      nav: [
        { id: uid(), label: "Dashboard", link: projects },
        { id: uid(), label: "Customers" },
        { id: uid(), label: "Settings" },
      ],
    },
    screens: [
      {
        id: projects,
        name: "Dashboard",
        path: "/dashboard",
        device: "desktop",
        shell: "sidebar",
        purpose: "Overview of revenue and the latest customers",
        root: n("stack", { gap: "lg" }, [
          n("row", { justify: "between" }, [
            n("heading", { text: "Dashboard", level: "1" }),
            n("button", { label: "Add customer" }, undefined, { link: detail, note: "Opens the new customer form" }),
          ]),
          n("grid", { cols: 3 }, [
            n("stat", { label: "Total revenue", value: "$45,231.89", delta: "+20.1% from last month" }),
            n("stat", { label: "Subscriptions", value: "+2,350", delta: "+180.1% from last month" }),
            n("stat", { label: "Active now", value: "573", delta: "+201 since last hour" }),
          ]),
          n("card", { title: "Recent customers", description: "Latest sign-ups this month" }, [
            n("table", { columns: "Customer, Email, Status, Amount", rows: 5 }, undefined, {
              note: "Rows open the customer's detail page",
            }),
          ]),
        ]),
      },
      {
        id: detail,
        name: "New customer",
        path: "/customers/new",
        device: "desktop",
        shell: "sidebar",
        purpose: "Form to add a customer",
        root: n("stack", { gap: "lg" }, [
          n("heading", { text: "New customer", level: "1" }),
          n("card", { title: "Details", description: "This information is shown on invoices." }, [
            n("grid", { cols: 2 }, [
              n("input", { label: "Full name", placeholder: "Olivia Martin" }),
              n("input", { label: "Email", placeholder: "olivia@example.com", type: "email" }),
            ]),
            n("select", { label: "Plan", placeholder: "Select a plan", options: "Free, Pro, Team" }),
            n("switch", { label: "Send welcome email", description: "We'll email them a sign-in link." }),
            n("row", { justify: "end", gap: "sm" }, [
              n("button", { label: "Cancel", variant: "outline" }, undefined, { link: projects }),
              n("button", { label: "Create customer" }, undefined, { link: projects, note: "Validates, saves, then returns to the dashboard with a toast" }),
            ]),
          ]),
        ]),
      },
    ],
  }
}
