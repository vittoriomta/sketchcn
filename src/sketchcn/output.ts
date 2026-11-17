// Turns a sketch into a brief an agent can build from without guessing.

import type { Flow, Screen, SketchDoc, SketchNode } from "./format"
import { alignClass, walk } from "./format"
import { KIT, MODULE_EXPORTS, indent } from "./kit"
import { describeTheme, fontOf, themeCSS } from "./theme"

export type OutputOptions = {
  /** Path alias for ui components, from components.json. */
  uiAlias?: string
  /** Only this screen; otherwise the whole flow. */
  screenId?: string
}

function nodeCode(node: SketchNode, doc: SketchDoc, flow?: Flow): string {
  const part = KIT[node.type]
  if (!part) return `{/* unknown part: ${node.type} */}`
  const kids = (node.children ?? []).map((c) => indent(nodeCode(c, doc, part.container?.flow), 1)).join("\n")
  let code = part.code(node.props, kids)
  // Alignment wraps the element so it holds in any parent.
  const cls = alignClass(node.align, flow)
  if (cls) code = `<div className="${cls}">\n${indent(code, 1)}\n</div>`
  const comments: string[] = []
  if (node.link) {
    const target = doc.screens.find((s) => s.id === node.link)
    if (target) comments.push(`→ navigates to "${target.name}" (${target.path})`)
  }
  if (node.note) comments.push(node.note)
  if (comments.length) code = `{/* ${comments.join(" · ")} */}\n${code}`
  return code
}

function usedModules(screens: Screen[]) {
  const modules = new Set<string>()
  for (const screen of screens) {
    walk(screen.root, (n) => KIT[n.type]?.uses.forEach((m) => modules.add(m)))
    if (screen.shell !== "none") modules.add("button")
  }
  return [...modules].sort()
}

function shellLine(screen: Screen, doc: SketchDoc) {
  if (screen.shell === "full") return "Full-bleed app layout: no shell or page padding; the panes fill the viewport (h-svh) and scroll on their own."
  if (screen.shell === "none") return "No app shell: the content is the whole page."
  const nav = doc.app.nav
    .map((item) => {
      const target = doc.screens.find((s) => s.id === item.link)
      return target ? `${item.label} → ${target.path}` : item.label
    })
    .join(", ")
  const where = screen.shell === "sidebar" ? "a left sidebar" : "a top navigation bar"
  return `Shared app shell with ${where} titled "${doc.app.name}". Nav items: ${nav || "none"}.`
}

export function toPrompt(doc: SketchDoc, options: OutputOptions = {}) {
  const ui = options.uiAlias ?? "@/components/ui"
  const screens = options.screenId ? doc.screens.filter((s) => s.id === options.screenId) : doc.screens
  const modules = usedModules(screens)

  const out: string[] = []
  out.push(`# Build: ${doc.app.name}${screens.length === 1 ? ` — ${screens[0].name}` : ""}`)
  out.push("")
  out.push(
    "This is a sketch made with sketchcn using this project's own shadcn/ui components. " +
      "Implement it with those components and Tailwind, matching the structure, component choice, " +
      "copy and navigation below. The JSX is a structural reference: wire real data, state and routing " +
      "the way this codebase already does. Comments carry the author's intent; follow them.",
  )
  out.push("")
  // Only the names the generated code actually uses, so imports are exact.
  const allCode = screens.map((s) => nodeCode(s.root, doc)).join("\n")
  out.push("## Components")
  for (const m of modules) {
    const names = (MODULE_EXPORTS[m] ?? []).filter((n) => new RegExp(`[<.(\\s]${n}\\b`).test(allCode))
    if (!names.length) continue
    const note = ` (\`npx shadcn add ${m}\` if missing)`
    out.push(`- \`${ui}/${m}\`: ${names.join(", ")}${m === "chart" || m === "sonner" ? note : ""}`)
  }
  out.push("")

  const css = themeCSS(doc.theme)
  if (css) {
    const font = fontOf(doc.theme?.font)
    out.push("## Theme")
    out.push(`${describeTheme(doc.theme)}. Merge these tokens into the project's globals.css (keep any token not listed).${font ? ` Install the font with \`npm i ${font.fontsource}\` and import it once in the app entry.` : ""}`)
    out.push("")
    out.push("```css")
    out.push(css)
    out.push("```")
    out.push("")
  }

  if (screens.length > 1) {
    out.push("## Flow")
    for (const s of screens) {
      const links = new Set<string>()
      walk(s.root, (n) => {
        const target = doc.screens.find((t) => t.id === n.link)
        if (target && target.id !== s.id) links.add(`${target.name} (${target.path})`)
      })
      out.push(`- **${s.name}** \`${s.path}\`${links.size ? ` → ${[...links].join(", ")}` : ""}`)
    }
    out.push("")
  }

  screens.forEach((s, i) => {
    out.push(`## ${screens.length > 1 ? `${i + 1}. ` : ""}${s.name} — \`${s.path}\``)
    out.push("")
    if (s.purpose) out.push(`Purpose: ${s.purpose}`)
    out.push(`Viewport: ${s.device === "mobile" ? "mobile-first (390px wide)" : "desktop (responsive down to mobile)"}.`)
    out.push(shellLine(s, doc))
    out.push("")
    out.push("```tsx")
    out.push(nodeCode(s.root, doc))
    out.push("```")
    out.push("")
  })

  return out.join("\n").trimEnd() + "\n"
}

export function toJSON(doc: SketchDoc) {
  return JSON.stringify(doc, null, 2)
}
