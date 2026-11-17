// The kit: every part you can place, how it renders with the project's own
// shadcn components, which fields it exposes, and the JSX it hands the agent.

import type { SketchNode } from "./format"
import type { ReactNode } from "react"
import type { Part } from "./kit-base"
import { GAP, camel, esc, gap, indent, justify, list, measure, pad, s, surface, wrap } from "./kit-base"
import { MORE_PARTS } from "./kit-more"
import { AI_PARTS } from "./kit-ai"
import { APP_PARTS } from "./kit-app"
import { uid } from "./format"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

// Plausible sample cells so a sketched table reads like a real one. The other columns give context:
// a "Name" next to "Size" is a file, next to "Domain" a company, otherwise a person.
const pick = <T,>(xs: T[], row: number) => xs[row % xs.length]
function sampleCell(column: string, row: number, columns: string[] = []): ReactNode {
  const c = column.toLowerCase().trim()
  const all = columns.join(" ").toLowerCase()
  const people = ["Olivia Martin", "Jackson Lee", "Isabella Nguyen", "William Kim", "Sofia Davis", "Liam Rossi"]
  const files = ["pricing_playbook_2026.pdf", "billing_faq.md", "refund_policy.docx", "plans_matrix.xlsx", "onboarding_guide.pdf", "sla_terms.md"]
  const companies = ["Northwind", "Lumen Labs", "Acme Logistics", "Brightpath", "Fieldnote", "Orbital"]
  const badge = (v: string, strong: boolean) => <Badge variant={strong ? "default" : "secondary"}>{v}</Badge>
  if (!c) return ""
  if (c.includes("status") && /run|duration|batch|progress/.test(all)) return row % 4 === 1 ? <Badge variant="destructive">Failed</Badge> : badge(pick(["Succeeded", "Failed", "Running", "Succeeded"], row), false)
  if (c.includes("status")) return badge(pick(["Active", "Pending", "Paused"], row), row % 3 === 0)
  if (c.includes("priority")) return badge(pick(["High", "Medium", "Low", "Urgent"], row), row % 4 === 3)
  if (/section/.test(c)) return pick(["Narrative", "Technical approach", "Cover page", "Table of contents"], row)
  if (c === "level") return badge(pick(["info", "warn", "error", "info"], row), row % 4 === 2)
  if (c.includes("progress")) return `${pick([100, 64, 12, 88, 40], row)}%`
  if (/amount|price|total|revenue|cost|arr|mrr/.test(c)) return `$${(1240 + row * 317.5).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  if (/currency/.test(c)) return pick(["usd", "eur", "gbp"], row)
  if (/(^|\s)by$|owner|reviewer|assignee|author/.test(c)) return pick(people, row)
  if (/^time$/.test(c)) return `14:0${row}:${String(12 + row * 7).padStart(2, "0")}`
  if (/date|created|updated|last used|modified|when/.test(c)) return pick(["Nov 17, 2026", "Nov 16, 2026", "Nov 14, 2026", "Nov 9, 2026", "Oct 30, 2026", "Oct 21, 2026"], row)
  if (c.includes("email")) return `${pick(people, row).split(" ")[0].toLowerCase()}@example.com`
  if (/size/.test(c)) return pick(["2.4 MB", "86 KB", "1.1 MB", "412 KB", "5.8 MB", "38 KB"], row)
  if (/type|format|kind/.test(c) && !/section/.test(c)) return all.includes("command") ? pick(["stdio", "http", "sse"], row) : pick(["PDF", "Markdown", "Word", "Sheet"], row)
  if (/region|location/.test(c)) return pick(["eu-west-1", "us-east-1", "eu-central-1"], row)
  if (/domain|website|url|command/.test(c)) return all.includes("command") ? pick(["npx @acme/mcp-github", "https://mcp.linear.app/sse", "uvx mcp-server-fetch"], row) : pick(["northwind.com", "lumenlabs.io", "acme.co", "brightpath.dev"], row)
  if (/employees|requests|orders|tokens|calls|runs|\bcount\b|chunks|target|limit/.test(c)) return pick([12480, 3210, 862, 45120, 199, 7704], row).toLocaleString("en-US")
  if (c === "key") return `sk-…${pick(["4f2a", "9c1e", "07bd", "e33f"], row)}`
  if (c === "model") return pick(["Atlas 4 Pro", "Atlas 4 Mini", "Atlas Reasoning"], row)
  if (/plan|tier/.test(c)) return pick(["Pro", "Team", "Free", "Enterprise"], row)
  if (/role/.test(c)) return pick(["Admin", "Member", "Viewer"], row)
  if (/duration|latency/.test(c)) return pick(["1.2s", "840ms", "3.4s", "210ms"], row)
  if (/icp/.test(c)) return pick(["Yes", "No"], row)
  if (/linkedin/.test(c)) return pick(["/company/northwind", "/company/lumen-labs", "/company/acme"], row)
  if (/address/.test(c)) return pick(["Via Torino 12, Milan", "500 Howard St, SF", "Kurfürstendamm 21, Berlin"], row)
  if (/agent/.test(c)) return pick(["Churn analyst", "Support triage", "SQL helper"], row)
  if (/^run$|batch/.test(c)) return `run_${pick(["8f3a", "77c1", "a90d", "1be4"], row)}`
  if (/task|title|subject|issue|message|header|chunk|before|after/.test(c)) return pick(["Retry failed webhook deliveries", "Add idempotency keys to payments", "Fix flaky invoice test", "Document the new rate limits", "Upgrade the queue worker"], row)
  if (/invoice/.test(c)) return `INV-2026-${String(140 - row).padStart(4, "0")}`
  if (c.endsWith("_id")) return `${c.slice(0, 3)}_${pick(["8KfQ2", "3nVx7", "Lp09d", "q4Wm1", "Zt6Rb"], row)}`
  if (c === "id" || c.endsWith(" id")) return `#${4120 + row}`
  if (/name|file|document/.test(c)) return /size|chunk/.test(all) ? pick(files, row) : /domain|employees|arr/.test(all) ? pick(companies, row) : pick(people, row)
  if (/user|customer|owner|reviewer|assignee|author|by/.test(c)) return pick(people, row)
  if (/company|account|org/.test(c)) return pick(companies, row)
  return `${column} ${row + 1}`
}

const parts: Part[] = [
  // ── Layout ────────────────────────────────────────────────────────────
  {
    type: "stack",
    label: "Stack",
    category: "Layout",
    terms: "column vertical panel pane",
    container: {
      flow: "column",
      slotClass: (p) => `flex flex-col ${gap(p.gap)} ${pad(p.padding)} ${p.border === "bottom" ? "border-b" : ""} ${surface(p.surface)} ${measure(p.width)} ${(p.surface && p.surface !== "none") || p.region === "main" ? "h-full flex-1" : ""} ${p.region === "body" ? "flex-1" : ""}`,
    },
    defaults: () => ({ props: { gap: "md", padding: "none", surface: "none" }, children: [] }),
    fields: [
      GAP,
      { key: "padding", label: "Padding", kind: "select", options: ["none", "sm", "md", "lg", "bar", "page", "x", "section"] },
      { key: "border", label: "Border", kind: "select", options: ["none", "bottom"] },
      { key: "surface", label: "Surface", kind: "select", options: ["none", "muted", "sidebar", "card"] },
      { key: "width", label: "Width", kind: "select", options: ["full", "reading", "narrow"] },
    ],
    render: (_p, slot) => slot,
    uses: [],
    code: (p, kids) =>
      wrap(
        `<div className="${["flex flex-col", gap(p.gap), pad(p.padding), p.border === "bottom" ? "border-b" : "", surface(p.surface), measure(p.width), p.region === "main" ? "min-h-0 min-w-0" : "", p.region === "body" ? "flex-1 overflow-auto" : ""].filter(Boolean).join(" ")}">`,
        kids,
        `</div>`,
      ),
  },
  {
    type: "row",
    label: "Row",
    category: "Layout",
    container: {
      flow: "row",
      slotClass: (p) => `flex flex-row flex-wrap items-center ${gap(p.gap)} ${justify(p.justify)}`,
    },
    defaults: () => ({ props: { gap: "md", justify: "start" }, children: [] }),
    fields: [
      GAP,
      { key: "justify", label: "Justify", kind: "select", options: ["start", "center", "between", "end"] },
    ],
    render: (_p, slot) => slot,
    uses: [],
    code: (p, kids) =>
      wrap(`<div className="flex items-center ${gap(p.gap)} ${justify(p.justify)}">`, kids, `</div>`),
  },
  {
    type: "grid",
    label: "Grid",
    category: "Layout",
    container: {
      flow: "grid",
      slotClass: (p) =>
        `grid ${gap(p.gap)} ${({ 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" } as Record<string, string>)[s(p.cols)] ?? "grid-cols-3"}`,
    },
    defaults: () => ({ props: { cols: 3, gap: "md" }, children: [] }),
    fields: [{ key: "cols", label: "Columns", kind: "select", options: ["1", "2", "3", "4"] }, GAP],
    render: (_p, slot) => slot,
    uses: [],
    code: (p, kids) =>
      wrap(`<div className="grid grid-cols-1 md:grid-cols-${s(p.cols)} ${gap(p.gap)}">`, kids, `</div>`),
  },
  {
    type: "card",
    label: "Card",
    category: "Layout",
    container: { flow: "column", slotClass: () => "flex flex-col gap-4" },
    defaults: () => ({ props: { title: "Card title", description: "" }, children: [] }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
    ],
    render: (p, slot) => (
      <Card>
        {(p.title || p.description) && (
          <CardHeader>
            {p.title && <CardTitle>{s(p.title)}</CardTitle>}
            {p.description && <CardDescription>{s(p.description)}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>{slot}</CardContent>
      </Card>
    ),
    uses: ["card"],
    code: (p, kids) => {
      const header =
        p.title || p.description
          ? `  <CardHeader>\n${p.title ? `    <CardTitle>${esc(p.title)}</CardTitle>\n` : ""}${
              p.description ? `    <CardDescription>${esc(p.description)}</CardDescription>\n` : ""
            }  </CardHeader>\n`
          : ""
      const body = kids
        ? `  <CardContent className="flex flex-col gap-4">\n${indent(kids, 1)}\n  </CardContent>\n`
        : ""
      return `<Card>\n${header}${body}</Card>`
    },
  },
  {
    type: "tabs",
    label: "Tabs",
    category: "Layout",
    container: { flow: "column", slotClass: () => "flex flex-col gap-4" },
    defaults: () => ({ props: { tabs: "Overview, Analytics, Reports" }, children: [] }),
    fields: [
      { key: "tabs", label: "Tabs (comma separated)", kind: "text" },
      { key: "variant", label: "Style", kind: "select", options: ["default", "line"] },
      { key: "bar", label: "Tab bar only", kind: "boolean" },
    ],
    render: (p, slot) => {
      const tabs = list(p.tabs)
      return (
        <Tabs defaultValue={tabs[0]} className="gap-4">
          <TabsList variant={p.variant === "line" ? "line" : "default"} className={p.variant === "line" ? "h-9 gap-4 p-0" : undefined}>
            {tabs.map((t, ki) => (
              <TabsTrigger key={ki} value={t}>
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
          {!p.bar && slot}
        </Tabs>
      )
    },
    uses: ["tabs"],
    code: (p, kids) => {
      const tabs = list(p.tabs)
      const triggers = tabs.map((t) => `    <TabsTrigger value="${esc(t)}">${esc(t)}</TabsTrigger>`).join("\n")
      const content = `  <TabsContent value="${esc(tabs[0])}" className="flex flex-col gap-4">${
        kids ? `\n${indent(kids, 1)}\n  ` : ""
      }</TabsContent>`
      const listAttr = p.variant === "line" ? ` variant="line"` : ""
      return `<Tabs defaultValue="${esc(tabs[0])}">\n  <TabsList${listAttr}>\n${triggers}\n  </TabsList>${p.bar ? "" : `\n${content}`}\n</Tabs>`
    },
  },

  {
    type: "split",
    label: "Split",
    category: "Layout",
    terms: "columns panes sidebar aside two three panel workspace",
    container: {
      flow: "grid",
      slotClass: (p) =>
        `skc-split ${s(p.layout).startsWith("sidebar") ? "skc-split-side" : ""} grid ${p.dividers ? "items-stretch divide-x" : "items-start"} ${p.fill ? "min-h-[760px]" : ""} ${gap(p.gap)} ${({ "sidebar-main": "grid-cols-[260px_minmax(0,1fr)]", "main-aside": "grid-cols-[minmax(0,1fr)_320px]", "sidebar-main-aside": "grid-cols-[240px_minmax(0,1fr)_300px]", halves: "grid-cols-2" } as Record<string, string>)[s(p.layout)] ?? "grid-cols-2"}`,
    },
    defaults: () => ({ props: { layout: "main-aside", gap: "lg", dividers: false, fill: false }, children: [] }),
    fields: [
      { key: "layout", label: "Panes", kind: "select", options: ["sidebar-main", "main-aside", "sidebar-main-aside", "halves"] },
      GAP,
      { key: "dividers", label: "Dividers between panes", kind: "boolean" },
      { key: "fill", label: "Fill the screen height", kind: "boolean" },
    ],
    render: (_p, slot) => slot,
    uses: [],
    code: (p, kids) => {
      const cols = ({ "sidebar-main": "md:grid-cols-[260px_1fr]", "main-aside": "lg:grid-cols-[1fr_320px]", "sidebar-main-aside": "lg:grid-cols-[240px_1fr_300px]", halves: "md:grid-cols-2" } as Record<string, string>)[s(p.layout)] ?? "md:grid-cols-2"
      const extra = [p.dividers ? "divide-x" : "items-start", p.fill ? "h-svh" : ""].filter(Boolean).join(" ")
      const note = s(p.layout).startsWith("sidebar") ? `{/* Below md the sidebar moves into a Sheet behind a menu button */}\n` : ""
      return note + wrap(`<div className="grid grid-cols-1 ${extra} ${cols} ${gap(p.gap)}">`, kids, `</div>`)
    },
  },
  {
    type: "spacer",
    label: "Spacer",
    category: "Layout",
    terms: "push bottom footer flex grow space fill",
    defaults: () => ({ props: {} }),
    fields: [],
    render: () => <div className="h-full min-h-3 min-w-3" />,
    uses: [],
    code: () => `<div className="flex-1" />`,
  },
  {
    type: "center",
    label: "Center",
    category: "Layout",
    terms: "centered auth narrow column middle",
    container: {
      flow: "column",
      slotClass: (p) => `mx-auto flex w-full flex-col ${gap(p.gap)} ${({ sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-5xl" } as Record<string, string>)[s(p.width)] ?? "max-w-sm"}`,
    },
    defaults: () => ({ props: { width: "sm", gap: "lg" }, children: [] }),
    fields: [{ key: "width", label: "Width", kind: "select", options: ["sm", "md", "lg", "xl"] }, GAP],
    render: (_p, slot) => <div className="flex min-h-[680px] w-full items-center justify-center py-10">{slot}</div>,
    uses: [],
    code: (p, kids) => {
      const w = ({ sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-5xl" } as Record<string, string>)[s(p.width)] ?? "max-w-sm"
      return `<div className="flex min-h-svh items-center justify-center p-6">\n  <div className="flex w-full ${w} flex-col ${gap(p.gap)}">\n${indent(kids, 2)}\n  </div>\n</div>`
    },
  },

  // ── Content ───────────────────────────────────────────────────────────
  {
    type: "heading",
    label: "Heading",
    category: "Content",
    defaults: () => ({ props: { text: "Heading", level: "2" } }),
    fields: [
      { key: "text", label: "Text", kind: "text" },
      { key: "level", label: "Level", kind: "select", options: ["1", "2", "3", "4"] },
    ],
    render: (p) => {
      const cls = { 1: "text-3xl font-semibold tracking-tight", 2: "text-xl font-semibold tracking-tight", 3: "text-base font-medium", 4: "text-[13px] font-medium" }[s(p.level)] ?? ""
      return <div className={cls}>{s(p.text)}</div>
    },
    uses: [],
    code: (p) => {
      const cls = { 1: "text-3xl font-semibold tracking-tight", 2: "text-xl font-semibold tracking-tight", 3: "text-base font-medium", 4: "text-[13px] font-medium" }[s(p.level)] ?? ""
      return `<h${s(p.level)} className="${cls}">${esc(p.text)}</h${s(p.level)}>`
    },
  },
  {
    type: "text",
    label: "Text",
    category: "Content",
    defaults: () => ({ props: { text: "Some supporting text that explains this section.", muted: true } }),
    fields: [
      { key: "text", label: "Text", kind: "textarea" },
      { key: "muted", label: "Muted", kind: "boolean" },
    ],
    render: (p) => <p className={`text-sm ${p.muted ? "text-muted-foreground" : ""}`}>{s(p.text)}</p>,
    uses: [],
    code: (p) => `<p className="text-sm${p.muted ? " text-muted-foreground" : ""}">${esc(p.text)}</p>`,
  },
  {
    type: "badge",
    label: "Badge",
    category: "Content",
    defaults: () => ({ props: { text: "New", variant: "secondary" } }),
    fields: [
      { key: "text", label: "Text", kind: "text" },
      { key: "variant", label: "Variant", kind: "select", options: ["default", "secondary", "outline", "destructive"] },
    ],
    render: (p) => <Badge variant={s(p.variant) as "default"}>{s(p.text)}</Badge>,
    uses: ["badge"],
    code: (p) => `<Badge variant="${s(p.variant)}">${esc(p.text)}</Badge>`,
  },
  {
    type: "avatar",
    label: "Avatar",
    category: "Content",
    defaults: () => ({ props: { name: "Olivia Martin", showName: true } }),
    fields: [
      { key: "name", label: "Name", kind: "text" },
      { key: "showName", label: "Show name", kind: "boolean" },
    ],
    render: (p) => {
      const initials = s(p.name).split(" ").map((w) => w[0]).join("").slice(0, 2)
      return (
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {p.showName && <span className="text-sm font-medium">{s(p.name)}</span>}
        </div>
      )
    },
    uses: ["avatar"],
    code: (p) => {
      const initials = s(p.name).split(" ").map((w) => w[0]).join("").slice(0, 2)
      const av = `<Avatar>\n  <AvatarFallback>${initials}</AvatarFallback>\n</Avatar>`
      return p.showName
        ? `<div className="flex items-center gap-2">\n${indent(av, 1)}\n  <span className="text-sm font-medium">${esc(p.name)}</span>\n</div>`
        : av
    },
  },
  {
    type: "image",
    label: "Image",
    category: "Content",
    defaults: () => ({ props: { label: "Image", ratio: "16/9" } }),
    fields: [
      { key: "label", label: "What it shows", kind: "text" },
      { key: "ratio", label: "Aspect ratio", kind: "select", options: ["16/9", "4/3", "1/1", "3/4"] },
    ],
    render: (p) => (
      <div
        className="flex w-full items-center justify-center rounded-lg border border-dashed bg-muted/50 text-xs text-muted-foreground"
        style={{ aspectRatio: s(p.ratio) }}
      >
        {s(p.label)}
      </div>
    ),
    uses: [],
    code: (p) =>
      `<img src="…" alt="${esc(p.label)}" className="aspect-[${s(p.ratio)}] w-full rounded-lg object-cover" />`,
  },
  {
    type: "separator",
    label: "Separator",
    category: "Content",
    defaults: () => ({ props: {} }),
    fields: [],
    render: () => <Separator />,
    uses: ["separator"],
    code: () => `<Separator />`,
  },

  // ── Forms ─────────────────────────────────────────────────────────────
  {
    type: "button",
    label: "Button",
    category: "Actions",
    defaults: () => ({ props: { label: "Button", variant: "default", size: "default", full: false } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "variant", label: "Variant", kind: "select", options: ["default", "secondary", "outline", "ghost", "destructive", "link"] },
      { key: "size", label: "Size", kind: "select", options: ["sm", "default", "lg"] },
      { key: "full", label: "Full width", kind: "boolean" },
    ],
    render: (p) => (
      <Button variant={s(p.variant) as "default"} size={s(p.size) as "default"} className={p.full ? (p.variant === "ghost" || p.variant === "secondary" ? "w-full justify-start" : "w-full") : undefined}>
        {s(p.label)}
      </Button>
    ),
    uses: ["button"],
    code: (p) => {
      const attrs = [
        p.variant !== "default" ? ` variant="${s(p.variant)}"` : "",
        p.size !== "default" ? ` size="${s(p.size)}"` : "",
        p.full ? (p.variant === "ghost" || p.variant === "secondary" ? ` className="w-full justify-start"` : ` className="w-full"`) : "",
      ].join("")
      return `<Button${attrs}>${esc(p.label)}</Button>`
    },
  },
  {
    type: "input",
    label: "Input",
    category: "Forms",
    defaults: () => ({ props: { label: "Email", placeholder: "you@example.com", type: "text" } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "placeholder", label: "Placeholder", kind: "text" },
      { key: "type", label: "Type", kind: "select", options: ["text", "email", "password", "number", "search"] },
    ],
    render: (p) => (
      <div className="grid w-full gap-2">
        {p.label && <Label>{s(p.label)}</Label>}
        <Input type={s(p.type)} placeholder={s(p.placeholder)} tabIndex={-1} />
      </div>
    ),
    uses: ["input", "label"],
    code: (p) => {
      const input = `<Input type="${s(p.type)}" placeholder="${esc(p.placeholder)}" />`
      return p.label
        ? `<div className="grid gap-2">\n  <Label>${esc(p.label)}</Label>\n  ${input}\n</div>`
        : input
    },
  },
  {
    type: "textarea",
    label: "Textarea",
    category: "Forms",
    defaults: () => ({ props: { label: "Message", placeholder: "Type your message here." } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "placeholder", label: "Placeholder", kind: "text" },
    ],
    render: (p) => (
      <div className="grid w-full gap-2">
        {p.label && <Label>{s(p.label)}</Label>}
        <Textarea placeholder={s(p.placeholder)} tabIndex={-1} />
      </div>
    ),
    uses: ["textarea", "label"],
    code: (p) =>
      `<div className="grid gap-2">\n  <Label>${esc(p.label)}</Label>\n  <Textarea placeholder="${esc(p.placeholder)}" />\n</div>`,
  },
  {
    type: "select",
    label: "Select",
    category: "Forms",
    defaults: () => ({ props: { label: "Plan", placeholder: "Select a plan", options: "Free, Pro, Team" } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "placeholder", label: "Placeholder", kind: "text" },
      { key: "options", label: "Options (comma separated)", kind: "text" },
    ],
    render: (p) => (
      <div className="grid w-full gap-2">
        {p.label && <Label>{s(p.label)}</Label>}
        <Select>
          <SelectTrigger className="w-full" tabIndex={-1}>
            <SelectValue placeholder={s(p.placeholder)} />
          </SelectTrigger>
        </Select>
      </div>
    ),
    uses: ["select", "label"],
    code: (p) => {
      const items = list(p.options)
        .map((o) => `      <SelectItem value="${esc(o).toLowerCase()}">${esc(o)}</SelectItem>`)
        .join("\n")
      return `<div className="grid gap-2">\n  <Label>${esc(p.label)}</Label>\n  <Select>\n    <SelectTrigger>\n      <SelectValue placeholder="${esc(p.placeholder)}" />\n    </SelectTrigger>\n    <SelectContent>\n${indent(items, -1)}\n    </SelectContent>\n  </Select>\n</div>`
    },
  },
  {
    type: "checkbox",
    label: "Checkbox",
    category: "Forms",
    defaults: () => ({ props: { label: "Remember me" } }),
    fields: [{ key: "label", label: "Label", kind: "text" }],
    render: (p) => (
      <div className="flex items-center gap-2">
        <Checkbox tabIndex={-1} />
        <Label>{s(p.label)}</Label>
      </div>
    ),
    uses: ["checkbox", "label"],
    code: (p) => `<div className="flex items-center gap-2">\n  <Checkbox id="…" />\n  <Label htmlFor="…">${esc(p.label)}</Label>\n</div>`,
  },
  {
    type: "switch",
    label: "Switch",
    category: "Forms",
    defaults: () => ({ props: { label: "Email notifications", description: "" } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
    ],
    render: (p) => (
      <div className="flex w-full items-center justify-between gap-4">
        <div className="grid gap-1">
          <Label>{s(p.label)}</Label>
          {p.description && <p className="text-xs text-muted-foreground">{s(p.description)}</p>}
        </div>
        <Switch tabIndex={-1} />
      </div>
    ),
    uses: ["switch", "label"],
    code: (p) =>
      `<div className="flex items-center justify-between gap-4">\n  <div className="grid gap-1">\n    <Label>${esc(p.label)}</Label>\n${
        p.description ? `    <p className="text-xs text-muted-foreground">${esc(p.description)}</p>\n` : ""
      }  </div>\n  <Switch />\n</div>`,
  },

  // ── Data ──────────────────────────────────────────────────────────────
  {
    type: "stat",
    label: "Stat",
    category: "Data",
    defaults: () => ({ props: { label: "Total revenue", value: "$45,231.89", delta: "+20.1% from last month" } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "value", label: "Value", kind: "text" },
      { key: "delta", label: "Change", kind: "text" },
    ],
    render: (p) => (
      <Card className="min-w-32 gap-2">
        <CardHeader>
          <CardDescription>{s(p.label)}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{s(p.value)}</CardTitle>
        </CardHeader>
        {p.delta && <CardContent className="text-xs text-muted-foreground">{s(p.delta)}</CardContent>}
      </Card>
    ),
    uses: ["card"],
    code: (p) =>
      `<Card>\n  <CardHeader>\n    <CardDescription>${esc(p.label)}</CardDescription>\n    <CardTitle className="text-2xl tabular-nums">${esc(p.value)}</CardTitle>\n  </CardHeader>\n${
        p.delta ? `  <CardContent className="text-xs text-muted-foreground">${esc(p.delta)}</CardContent>\n` : ""
      }</Card>`,
  },
  {
    type: "table",
    label: "Table",
    category: "Data",
    defaults: () => ({ props: { columns: "Customer, Email, Status, Amount", rows: 5 } }),
    fields: [
      { key: "columns", label: "Columns (comma separated)", kind: "text" },
      { key: "rows", label: "Sample rows", kind: "number" },
    ],
    render: (p) => {
      const cols = list(p.columns)
      const rows = Math.max(1, Math.min(20, Number(p.rows) || 5))
      return (
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((c, ki) => (
                <TableHead key={ki}>{c}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }, (_, r) => (
              <TableRow key={r}>
                {cols.map((c, ki) => (
                  <TableCell key={ki}>{sampleCell(c, r, cols)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    },
    uses: ["table"],
    code: (p) => {
      const cols = list(p.columns)
      const heads = cols.map((c) => `      <TableHead>${esc(c)}</TableHead>`).join("\n")
      const cells = cols.map((c) => `        <TableCell>{row.${camel(c)}}</TableCell>`).join("\n")
      return `<Table>\n  <TableHeader>\n    <TableRow>\n${heads}\n    </TableRow>\n  </TableHeader>\n  <TableBody>\n    {rows.map((row) => (\n      <TableRow key={row.id}>\n${cells}\n      </TableRow>\n    ))}\n  </TableBody>\n</Table>`
    },
  },
  {
    type: "chart",
    label: "Chart",
    category: "Data",
    defaults: () => ({ props: { title: "Revenue over time", kind: "bar" } }),
    fields: [
      { key: "title", label: "What it plots", kind: "text" },
      { key: "kind", label: "Kind", kind: "select", options: ["bar", "line", "area"] },
    ],
    render: (p) => <ChartSketch kind={s(p.kind)} title={s(p.title)} />,
    uses: ["chart"],
    code: (p) => `{/* ${s(p.kind)} chart: ${esc(p.title)} — use shadcn <ChartContainer> with Recharts */}\n<ChartContainer config={chartConfig} className="h-64 w-full">\n  {/* <${s(p.kind) === "bar" ? "BarChart" : s(p.kind) === "line" ? "LineChart" : "AreaChart"} data={data}> … */}\n</ChartContainer>`,
  },
  {
    type: "progress",
    label: "Progress",
    category: "Data",
    defaults: () => ({ props: { label: "Storage used", value: 64 } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "value", label: "Value (0–100)", kind: "number" },
    ],
    render: (p) => (
      <div className="grid w-full gap-2">
        <div className="flex justify-between text-sm">
          <span>{s(p.label)}</span>
          <span className="text-muted-foreground tabular-nums">{Number(p.value)}%</span>
        </div>
        <Progress value={Number(p.value)} />
      </div>
    ),
    uses: ["progress"],
    code: (p) =>
      `<div className="grid gap-2">\n  <div className="flex justify-between text-sm">\n    <span>${esc(p.label)}</span>\n    <span className="text-muted-foreground">${Number(p.value)}%</span>\n  </div>\n  <Progress value={${Number(p.value)}} />\n</div>`,
  },

  // ── Feedback ──────────────────────────────────────────────────────────
  {
    type: "alert",
    label: "Alert",
    category: "Feedback",
    defaults: () => ({ props: { title: "Heads up!", description: "You can add components to your app using the CLI.", variant: "default" } }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
      { key: "variant", label: "Variant", kind: "select", options: ["default", "destructive"] },
    ],
    render: (p) => (
      <Alert variant={s(p.variant) as "default"}>
        <AlertTitle>{s(p.title)}</AlertTitle>
        <AlertDescription>{s(p.description)}</AlertDescription>
      </Alert>
    ),
    uses: ["alert"],
    code: (p) =>
      `<Alert${p.variant === "destructive" ? ` variant="destructive"` : ""}>\n  <AlertTitle>${esc(p.title)}</AlertTitle>\n  <AlertDescription>${esc(p.description)}</AlertDescription>\n</Alert>`,
  },
  {
    type: "empty",
    label: "Empty state",
    category: "Feedback",
    defaults: () => ({ props: { title: "No projects yet", description: "Create your first project to get started.", action: "New project" } }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
      { key: "action", label: "Action label", kind: "text" },
    ],
    render: (p) => (
      <div className="flex w-full flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
        <div className="text-base font-medium">{s(p.title)}</div>
        <p className="max-w-sm text-sm text-muted-foreground">{s(p.description)}</p>
        {p.action && <Button size="sm">{s(p.action)}</Button>}
      </div>
    ),
    uses: ["button"],
    code: (p) =>
      `<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">\n  <h3 className="text-base font-medium">${esc(p.title)}</h3>\n  <p className="max-w-sm text-sm text-muted-foreground">${esc(p.description)}</p>\n${
        p.action ? `  <Button size="sm">${esc(p.action)}</Button>\n` : ""
      }</div>`,
  },
]

function ChartSketch({ kind, title }: { kind: string; title: string }) {
  const values = [42, 68, 55, 80, 61, 94, 73, 88, 66, 97, 79, 90]
  const w = 480
  const h = 160
  const step = w / values.length
  const y = (v: number) => h - (v / 100) * (h - 12)
  const points = values.map((v, i) => `${i * step + step / 2},${y(v)}`).join(" ")
  return (
    <div className="grid w-full gap-2">
      <div className="text-sm font-medium">{title}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" preserveAspectRatio="none">
        {kind === "bar" &&
          values.map((v, i) => (
            <rect
              key={i}
              x={i * step + step * 0.18}
              y={y(v)}
              width={step * 0.64}
              height={h - y(v)}
              rx={3}
              style={{ fill: "var(--chart-1)" }}
            />
          ))}
        {kind === "area" && (
          <polygon
            points={`${step / 2},${h} ${points} ${w - step / 2},${h}`}
            style={{ fill: "var(--chart-1)", opacity: 0.25 }}
          />
        )}
        {kind !== "bar" && (
          <polyline
            points={points}
            fill="none"
            strokeWidth={2.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: "var(--chart-1)" }}
          />
        )}
      </svg>
    </div>
  )
}

export { CATEGORIES } from "./kit-base"
export type { Category, Field, Part } from "./kit-base"
export { indent } from "./kit-base"

const ALL = [...parts, ...MORE_PARTS, ...APP_PARTS, ...AI_PARTS]
export const KIT: Record<string, Part> = Object.fromEntries(ALL.map((p) => [p.type, p]))
export const PARTS = ALL

export function createNode(type: string): SketchNode {
  const part = KIT[type]
  const { props, children } = part.defaults()
  return { id: uid(), type, props, ...(part.container ? { children: children ?? [] } : {}) }
}

/** Every component each shadcn module exports; the prompt lists only the ones the code uses. */
export const MODULE_EXPORTS: Record<string, string[]> = {
  accordion: ["Accordion", "AccordionItem", "AccordionTrigger", "AccordionContent"],
  "alert-dialog": ["AlertDialog", "AlertDialogContent", "AlertDialogHeader", "AlertDialogTitle", "AlertDialogDescription", "AlertDialogFooter", "AlertDialogCancel", "AlertDialogAction"],
  alert: ["Alert", "AlertTitle", "AlertDescription"],
  attachment: ["Attachment", "AttachmentMedia", "AttachmentContent", "AttachmentTitle", "AttachmentDescription"],
  avatar: ["Avatar", "AvatarFallback"],
  badge: ["Badge"],
  breadcrumb: ["Breadcrumb", "BreadcrumbList", "BreadcrumbItem", "BreadcrumbLink", "BreadcrumbPage", "BreadcrumbSeparator"],
  bubble: ["Bubble", "BubbleContent"],
  "button-group": ["ButtonGroup"],
  collapsible: ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"],
  button: ["Button"],
  calendar: ["Calendar"],
  card: ["Card", "CardHeader", "CardTitle", "CardDescription", "CardContent"],
  chart: ["ChartContainer"],
  checkbox: ["Checkbox"],
  "code-block": ["CodeBlock", "CodeBlockHeader", "CodeBlockTitle", "CodeBlockActions", "CodeBlockCopyButton", "CodeBlockContent", "CodeBlockLine"],
  command: ["Command", "CommandInput", "CommandList", "CommandEmpty", "CommandGroup", "CommandItem"],
  dialog: ["Dialog", "DialogContent", "DialogHeader", "DialogTitle", "DialogDescription", "DialogFooter", "DialogClose"],
  "dropdown-menu": ["DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem"],
  input: ["Input"],
  "input-group": ["InputGroup", "InputGroupAddon", "InputGroupButton", "InputGroupInput", "InputGroupTextarea"],
  "input-otp": ["InputOTP", "InputOTPGroup", "InputOTPSlot", "InputOTPSeparator"],
  item: ["Item", "ItemGroup", "ItemContent", "ItemTitle", "ItemDescription", "ItemActions"],
  kbd: ["Kbd", "KbdGroup"],
  label: ["Label"],
  marker: ["Marker", "MarkerContent"],
  message: ["Message", "MessageGroup", "MessageAvatar", "MessageContent", "MessageHeader"],
  "message-scroller": ["MessageScroller", "MessageScrollerViewport", "MessageScrollerContent"],
  pagination: ["Pagination", "PaginationContent", "PaginationItem", "PaginationLink", "PaginationPrevious", "PaginationNext"],
  progress: ["Progress"],
  questionnaire: ["Questionnaire", "QuestionnaireItem", "QuestionnaireTitle", "QuestionnaireChoices", "QuestionnaireChoice", "QuestionnaireActions", "QuestionnaireSubmit"],
  "radio-group": ["RadioGroup", "RadioGroupItem"],
  select: ["Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectItem"],
  separator: ["Separator"],
  sheet: ["Sheet", "SheetContent", "SheetHeader", "SheetTitle", "SheetDescription"],
  skeleton: ["Skeleton"],
  slider: ["Slider"],
  sonner: ["toast"],
  spinner: ["Spinner"],
  switch: ["Switch"],
  table: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"],
  tabs: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],
  textarea: ["Textarea"],
  "toggle-group": ["ToggleGroup", "ToggleGroupItem"],
  tooltip: ["Tooltip", "TooltipTrigger", "TooltipContent"],
  trace: ["Trace", "TraceLine", "TraceIcon", "TraceTitle", "TraceDescription", "TraceCollapsible", "TraceCollapsibleTrigger", "TraceCollapsibleContent"],
}
