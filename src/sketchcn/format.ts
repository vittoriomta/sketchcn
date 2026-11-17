import type { Theme } from "./theme"

// Sketch Format v1: the data a sketch is made of, and pure helpers for editing it.

export type PropValue = string | number | boolean
export type Props = Record<string, PropValue>

export type SketchNode = {
  id: string
  type: string
  props: Props
  children?: SketchNode[]
  /** Free-text intent for the agent: "filters the table below". */
  note?: string
  /** Where it sits in its parent: left/center/right in a column or grid, top/middle/bottom in a row. */
  align?: Align
  /** Screen id this element navigates to when clicked. */
  link?: string
}

export type Align = "start" | "center" | "end"
export type Flow = "column" | "row" | "grid"

/** Classes for a node's wrapper given its alignment and the parent's flow. */
export function alignClass(align: Align | undefined, flow: Flow | undefined) {
  if (!align || !flow) return ""
  if (flow === "row") return { start: "self-start", center: "self-center", end: "self-end" }[align]
  if (flow === "grid") return { start: "justify-self-start", center: "justify-self-center text-center", end: "justify-self-end text-right" }[align]
  return { start: "self-start", center: "self-center text-center", end: "self-end text-right" }[align]
}

/** Wrapper classes for nodes that fill their parent: the body column, sidebar surfaces, spacers. */
export function fillClass(node: SketchNode) {
  if (node.type === "spacer") return "flex-1"
  if (node.props.region === "body" || node.props.surface === "sidebar") return "flex flex-1 flex-col"
  return ""
}

/** "full": edge to edge, no padding, for app layouts made of panes. */
export type Shell = "none" | "sidebar" | "topbar" | "full"
export type Device = "desktop" | "mobile"

export type Screen = {
  id: string
  name: string
  path: string
  device: Device
  shell: Shell
  purpose?: string
  root: SketchNode
}

export type NavItem = { id: string; label: string; link?: string }

export type SketchDoc = {
  version: 1
  app: { name: string; nav: NavItem[] }
  screens: Screen[]
  /** Overrides on top of the project's theme; empty means the project's own. */
  theme?: Theme
}

export const uid = () => Math.random().toString(36).slice(2, 9)

export function findNode(root: SketchNode, id: string): SketchNode | null {
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const hit = findNode(child, id)
    if (hit) return hit
  }
  return null
}

export function findParent(
  root: SketchNode,
  id: string,
): { parent: SketchNode; index: number } | null {
  const children = root.children ?? []
  const index = children.findIndex((c) => c.id === id)
  if (index !== -1) return { parent: root, index }
  for (const child of children) {
    const hit = findParent(child, id)
    if (hit) return hit
  }
  return null
}

/** Returns a copy of the tree with `fn` applied to the node with `id`. */
export function mapNode(
  root: SketchNode,
  id: string,
  fn: (node: SketchNode) => SketchNode,
): SketchNode {
  if (root.id === id) return fn(root)
  if (!root.children) return root
  return { ...root, children: root.children.map((c) => mapNode(c, id, fn)) }
}

export function removeNode(root: SketchNode, id: string): SketchNode {
  if (!root.children) return root
  return {
    ...root,
    children: root.children
      .filter((c) => c.id !== id)
      .map((c) => removeNode(c, id)),
  }
}

export function insertNode(
  root: SketchNode,
  parentId: string,
  index: number,
  node: SketchNode,
): SketchNode {
  return mapNode(root, parentId, (parent) => {
    const children = [...(parent.children ?? [])]
    children.splice(Math.max(0, Math.min(index, children.length)), 0, node)
    return { ...parent, children }
  })
}

export function isAncestor(root: SketchNode, ancestorId: string, id: string) {
  const ancestor = findNode(root, ancestorId)
  return !!ancestor && ancestorId !== id && !!findNode(ancestor, id)
}

export function moveNode(
  root: SketchNode,
  id: string,
  parentId: string,
  index: number,
): SketchNode {
  if (id === parentId || isAncestor(root, id, parentId)) return root
  const node = findNode(root, id)
  const from = findParent(root, id)
  if (!node || !from) return root
  // Moving later inside the same parent: account for the removed slot.
  const adjusted =
    from.parent.id === parentId && from.index < index ? index - 1 : index
  return insertNode(removeNode(root, id), parentId, adjusted, node)
}

/** Deep copy with fresh ids. */
export function cloneNode(node: SketchNode): SketchNode {
  return {
    ...node,
    id: uid(),
    props: { ...node.props },
    children: node.children?.map(cloneNode),
  }
}

export function walk(root: SketchNode, fn: (node: SketchNode) => void) {
  fn(root)
  root.children?.forEach((c) => walk(c, fn))
}
