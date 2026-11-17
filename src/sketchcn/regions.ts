// Regions: where things go on an app screen. Almost every product screen is the same frame
// (a sidebar, a column with a header on top, and a body under it), so blocks don't need a
// precise drop: sidebars and headers take their slot, everything else lands in the body.
// Regions are tags on ordinary stack props, so the tree stays plain parts.

import { createNode } from "./kit"
import { findNode, findParent, insertNode, isAncestor, mapNode, type SketchNode } from "./format"

export type Region = "sidebar" | "header" | "main" | "body"

/** Which region a block belongs to, from its group. */
export const regionOfGroup = (group: string): Region =>
  group === "Sidebars" ? "sidebar" : group === "Headers" ? "header" : "body"

const regionOf = (n: SketchNode | undefined) => (n ? (n.props.region as Region | undefined) : undefined)
const tag = (n: SketchNode, region: Region): SketchNode => ({ ...n, props: { ...n.props, region } })

/** The screen's sidebar layout, if it has one: a split whose first pane is the sidebar. */
export function layoutOf(root: SketchNode) {
  const split = (root.children ?? []).find((c) => c.type === "split" && String(c.props.layout).startsWith("sidebar"))
  if (!split) return null
  const [sidebar, main] = split.children ?? []
  return { split, sidebar, main }
}

function bodyStack(children: SketchNode[]): SketchNode {
  return { ...createNode("stack"), props: { gap: "lg", padding: "lg", surface: "none", region: "body" }, children }
}

/** Splits loose content into header (if any) and body, as the children of a main column. */
function frameColumn(kids: SketchNode[]): SketchNode[] {
  const header = kids.find((k) => regionOf(k) === "header")
  const body = kids.find((k) => regionOf(k) === "body")
  const rest = kids.filter((k) => k !== header && k !== body)
  const bodyNode = body ? { ...body, children: [...(body.children ?? []), ...rest] } : bodyStack(rest)
  return header ? [header, bodyNode] : [bodyNode]
}

/** Makes sure the layout's main pane is a tagged column of [header?, body]. Older sketches get upgraded. */
function normalizeMain(root: SketchNode): SketchNode {
  const layout = layoutOf(root)
  if (!layout) return root
  const { split, main } = layout
  let nextMain: SketchNode
  if (!main) nextMain = { ...createNode("stack"), props: { gap: "none", padding: "none", surface: "none", region: "main" }, children: [bodyStack([])] }
  else if (regionOf(main) === "main") {
    const kids = main.children ?? []
    const ok = kids.every((k) => regionOf(k) === "header" || regionOf(k) === "body") && kids.some((k) => regionOf(k) === "body")
    if (ok) return root
    nextMain = { ...main, children: frameColumn(kids) }
  } else nextMain = { ...createNode("stack"), props: { gap: "none", padding: "none", surface: "none", region: "main" }, children: frameColumn([main]) }
  const panes = [...(split.children ?? [])]
  panes[1] = nextMain
  return mapNode(root, split.id, (s) => ({ ...s, children: panes }))
}

export type Placed = { root: SketchNode; id: string; swapped?: boolean }

/** Wraps the screen into "sidebar | main", or swaps the sidebar in place. */
function placeSidebar(root: SketchNode, side: SketchNode): Placed {
  const sidebar = tag(side, "sidebar")
  const layout = layoutOf(root)
  if (layout) {
    const panes = [...(layout.split.children ?? [])]
    panes[0] = sidebar
    return { root: normalizeMain(mapNode(root, layout.split.id, (s) => ({ ...s, children: panes }))), id: sidebar.id, swapped: true }
  }
  const main: SketchNode = { ...createNode("stack"), props: { gap: "none", padding: "none", surface: "none", region: "main" }, children: frameColumn(root.children ?? []) }
  const split: SketchNode = { ...createNode("split"), props: { layout: "sidebar-main", gap: "none", dividers: true, fill: true }, children: [sidebar, main] }
  return { root: { ...root, props: { ...root.props, gap: "none", padding: "none" }, children: [split] }, id: sidebar.id }
}

/** Puts a header on top of the content column (or the page), replacing the one that's there. */
function placeHeader(root: SketchNode, head: SketchNode): Placed {
  const header = tag(head, "header")
  const r = normalizeMain(root)
  const layout = layoutOf(r)
  const host = layout?.main ?? r
  const kids = host.children ?? []
  const swapped = regionOf(kids[0]) === "header"
  const next = swapped ? [header, ...kids.slice(1)] : [header, ...kids]
  return { root: mapNode(r, host.id, (h) => ({ ...h, children: next })), id: header.id, swapped }
}

/**
 * Where content should go. Inside the body, next to the selection; anywhere else
 * (nothing selected, the sidebar, the header, the layout itself) at the end of the body.
 */
export function contentTarget(root: SketchNode, selectedId: string | null, isContainer: (n: SketchNode) => boolean) {
  const layout = layoutOf(root)
  const body = layout?.main?.children?.find((k) => regionOf(k) === "body")
  const end = (host: SketchNode) => ({ parentId: host.id, index: host.children?.length ?? 0 })
  const selected = selectedId ? findNode(root, selectedId) : null
  if (!layout || !body) {
    if (!selected) return end(root)
    if (isContainer(selected) && regionOf(selected) !== "header") return end(selected)
    const loc = findParent(root, selected.id)
    return loc ? { parentId: loc.parent.id, index: loc.index + 1 } : end(root)
  }
  if (!selected || (selected.id !== body.id && !isAncestor(root, body.id, selected.id))) return end(body)
  if (isContainer(selected)) return end(selected)
  const loc = findParent(root, selected.id)
  return loc ? { parentId: loc.parent.id, index: loc.index + 1 } : end(body)
}

/** Keeps drops out of the layout's frame: a drop on the split or the main column lands in the body. */
export function redirectDrop(root: SketchNode, parentId: string, index: number) {
  const layout = layoutOf(root)
  if (!layout) return { parentId, index }
  const body = layout.main?.children?.find((k) => regionOf(k) === "body")
  if (!body) return { parentId, index }
  if (parentId === layout.split.id || parentId === layout.main?.id) {
    // Dropped above the header or on the sidebar edge: start of the body. Otherwise its end.
    const atTop = parentId === layout.main?.id && index === 0
    return { parentId: body.id, index: atTop ? 0 : (body.children?.length ?? 0) }
  }
  return { parentId, index }
}

/** Places a block by its region. Content goes to `target` when one is given (a drop), else by selection. */
export function placeBlock(
  root: SketchNode,
  node: SketchNode,
  region: Region,
  opts: { selectedId: string | null; isContainer: (n: SketchNode) => boolean; target?: { parentId: string; index: number } },
): Placed {
  if (region === "sidebar") return placeSidebar(root, node)
  if (region === "header") return placeHeader(root, node)
  const r = normalizeMain(root)
  const t = opts.target ? redirectDrop(r, opts.target.parentId, opts.target.index) : contentTarget(r, opts.selectedId, opts.isContainer)
  return { root: insertNode(r, t.parentId, t.index, node), id: node.id }
}
