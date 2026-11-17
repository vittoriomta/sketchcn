// Presets as data: a JSON-friendly spec turned into a Template with fresh ids and wired links.

import type { Align, Device, NavItem, Props, Screen, Shell, SketchNode } from "./format"
import { uid } from "./format"
import { KIT, createNode } from "./kit"
import type { Template } from "./templates"

export type SpecNode = {
  type: string
  props?: Props
  children?: SpecNode[]
  note?: string
  /** A screen key in the same preset. */
  link?: string
  align?: Align
}

export type PresetSpec = {
  id: string
  name: string
  category: "Starter" | "App" | "AI"
  description: string
  /** Where the layout was studied from, e.g. "Layout studied from owner/repo (MIT)". */
  credit?: string
  app?: string
  nav?: { label: string; link?: string }[]
  screens: {
    key: string
    name: string
    path: string
    shell: Shell
    device?: Device
    purpose?: string
    root: SpecNode
  }[]
}

export function build(spec: SpecNode, ids: Record<string, string>, issues: string[]): SketchNode {
  if (!KIT[spec.type]) {
    issues.push(spec.type)
    // Unknown part: keep the intent visible instead of dropping it.
    return { ...createNode("text"), props: { text: `[${spec.type}]`, muted: true }, note: spec.note }
  }
  const base = createNode(spec.type)
  const node: SketchNode = { ...base, props: { ...base.props, ...(spec.props ?? {}) } }
  if (KIT[spec.type].container) node.children = (spec.children ?? []).map((c) => build(c, ids, issues))
  if (spec.note) node.note = spec.note
  if (spec.align) node.align = spec.align
  if (spec.link && ids[spec.link]) node.link = ids[spec.link]
  return node
}

export function fromSpec(spec: PresetSpec): Template & { category: PresetSpec["category"]; credit?: string } {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    category: spec.category,
    credit: spec.credit,
    build: () => {
      const ids: Record<string, string> = Object.fromEntries(spec.screens.map((s) => [s.key, uid()]))
      const issues: string[] = []
      const screens: Screen[] = spec.screens.map((s) => ({
        id: ids[s.key],
        name: s.name,
        path: s.path,
        shell: s.shell,
        device: s.device ?? "desktop",
        purpose: s.purpose,
        root: build(s.root, ids, issues),
      }))
      const nav: NavItem[] = (spec.nav ?? []).map((n) => ({ id: uid(), label: n.label, link: n.link ? ids[n.link] : undefined }))
      if (issues.length) console.warn(`[sketchcn] preset "${spec.id}" uses unknown parts: ${[...new Set(issues)].join(", ")}`)
      return { screens, nav, app: spec.app }
    },
  }
}
