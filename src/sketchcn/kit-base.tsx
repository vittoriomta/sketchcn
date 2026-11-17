// Shared types and helpers for kit parts.
import type { ReactNode } from "react"
import type { Props, SketchNode } from "./format"

export type Category = "Layout" | "Content" | "Actions" | "Forms" | "Data" | "Navigation" | "Overlays" | "Feedback" | "AI"
export const CATEGORIES: Category[] = ["Layout", "Content", "Actions", "Forms", "Data", "Navigation", "Overlays", "Feedback", "AI"]

export type Field = {
  key: string
  label: string
  kind: "text" | "textarea" | "number" | "select" | "boolean"
  options?: string[]
}

export type Part = {
  type: string
  label: string
  category: Category
  /** Extra search words. */
  terms?: string
  /** Containers accept children; `flow` drives drop-index math. */
  container?: { flow: "column" | "row" | "grid"; slotClass: (p: Props) => string }
  defaults: () => { props: Props; children?: SketchNode[] }
  fields: Field[]
  /** `slot` is the drop zone holding the children (containers only). */
  render: (p: Props, slot: ReactNode) => ReactNode
  /** shadcn modules this part uses, for the prompt's import list. */
  uses: string[]
  /** JSX for the agent. `kids` is the already-rendered children code. */
  code: (p: Props, kids: string) => string
}

export const s = (v: unknown) => String(v ?? "")
export const list = (v: unknown) =>
  s(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
export const gap = (v: unknown) =>
  ({ none: "gap-0", sm: "gap-2", md: "gap-4", lg: "gap-8" })[s(v)] ?? "gap-4"
export const pad = (v: unknown) =>
  ({ sm: "p-3", md: "p-4", lg: "p-6", bar: "skc-bar min-h-13 justify-center px-6 py-2", page: "px-6 pt-6 pb-5", x: "px-6", section: "pb-2" })[s(v)] ?? ""
export const surface = (v: unknown) => ({ muted: "bg-muted/40", sidebar: "bg-sidebar text-sidebar-foreground", card: "bg-card text-card-foreground" })[s(v)] ?? ""
export const measure = (v: unknown) => ({ reading: "mx-auto w-full max-w-3xl", narrow: "mx-auto w-full max-w-xl" })[s(v)] ?? ""
export const justify = (v: unknown) =>
  ({
    start: "justify-start",
    center: "justify-center",
    between: "justify-between",
    end: "justify-end",
  })[s(v)] ?? "justify-start"
export const esc = (v: unknown) => s(v).replace(/[{}<>]/g, "")
export const wrap = (open: string, kids: string, close: string) =>
  kids ? `${open}\n${kids}\n${close}` : `${open}${close}`

export const GAP: Field = {
  key: "gap",
  label: "Gap",
  kind: "select",
  options: ["none", "sm", "md", "lg"],
}

export function indent(code: string, levels: number) {
  if (levels === 0) return code
  if (levels < 0) return code
  const pad = "  ".repeat(levels)
  return code
    .split("\n")
    .map((l) => (l ? pad + l : l))
    .join("\n")
}

export const camel = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")

