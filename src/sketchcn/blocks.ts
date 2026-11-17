// Blocks: designed sections (headers, sidebars, composers, chart panels, consoles…) between
// shadcn's atoms and full presets. Data only; inserted as an editable tree of parts.

import { BLOCK_DATA } from "./blocks-data"
import type { SketchNode } from "./format"
import { build } from "./preset"
import type { SpecNode } from "./preset"

export type BlockSpec = {
  id: string
  group: string
  name: string
  description: string
  /** How wide the block wants to be drawn in its thumbnail. */
  width?: "full" | "panel" | "narrow"
  root: SpecNode
}

export const BLOCKS: BlockSpec[] = BLOCK_DATA
export const BLOCK_GROUPS = [...new Set(BLOCKS.map((b) => b.group))]
export const blockById = (id: string) => BLOCKS.find((b) => b.id === id)

/** A fresh, editable tree for a block (new ids every time). */
export function buildBlock(spec: BlockSpec): SketchNode {
  const issues: string[] = []
  const node = build(spec.root, {}, issues)
  if (issues.length) console.warn(`[sketchcn] block "${spec.id}" uses unknown parts: ${[...new Set(issues)].join(", ")}`)
  return node
}

export const BLOCK_WIDTH = { full: 760, panel: 400, narrow: 280 } as const
