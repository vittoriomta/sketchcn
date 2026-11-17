// Parts that real apps needed when we rebuilt them as presets: icon rails, boards,
// scheduling slots, terminals, browser previews, file trees and message actions.

import {
  Archive,
  Bell,
  BookOpen,
  Box,
  ChartLine,
  ChevronsUpDown,
  CircleQuestionMark,
  Clock,
  CreditCard,
  FlaskConical,
  Inbox,
  LogOut,
  MessageSquare,
  Search,
  SquarePen,
  Terminal,
  ArrowLeft,
  ArrowRight,
  ChartColumn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Sparkles,
  Circle,
  Code,
  Copy,
  Database,
  File,
  Folder,
  House,
  Info,
  KeyRound,
  Lightbulb,
  Pencil,
  Plug,
  Plus,
  Radio,
  RefreshCw,
  RotateCw,
  ScrollText,
  Settings,
  Share,
  Table,
  ThumbsDown,
  ThumbsUp,
  Users,
  Volume2,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Part } from "./kit-base"
import { esc, list, s } from "./kit-base"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/** Pick an icon from a label, so presets only need words. */
function iconFor(label: string): LucideIcon {
  const l = label.toLowerCase()
  const map: [RegExp, LucideIcon][] = [
    [/new (thread|chat)|compose|write/, SquarePen],
    [/playground|lab|experiment/, FlaskConical],
    [/usage|metric/, ChartLine],
    [/api key|token/, KeyRound],
    [/billing|payment|invoice|plan/, CreditCard],
    [/automation|schedul|routine|cron/, Clock],
    [/skill|model|agent/, Box],
    [/thread|chat|conversation|message/, MessageSquare],
    [/inbox|mail/, Inbox],
    [/search|find/, Search],
    [/doc|guide|learn/, BookOpen],
    [/notif|alert/, Bell],
    [/help|support/, CircleQuestionMark],
    [/log ?out|sign ?out/, LogOut],
    [/project|folder|workspace/, Folder],
    [/plugin/, Plug],
    [/home|overview/, House],
    [/table/, Table],
    [/sql|query|editor|code/, Code],
    [/database|db/, Database],
    [/auth|user|people|member/, Users],
    [/storage|archive|file/, Archive],
    [/function|edge|zap/, Zap],
    [/realtime|live/, Radio],
    [/advisor|insight|tip/, Lightbulb],
    [/log/, ScrollText],
    [/report|analytic|chart/, ChartColumn],
    [/integration|plug/, Plug],
    [/key|secret|vault/, KeyRound],
    [/setting/, Settings],
  ]
  return map.find(([re]) => re.test(l))?.[1] ?? Circle
}

const ACTION_ICONS: [RegExp, LucideIcon][] = [
  [/copy/i, Copy],
  [/edit/i, Pencil],
  [/read|speak|aloud/i, Volume2],
  [/good|like|up/i, ThumbsUp],
  [/bad|dislike|down/i, ThumbsDown],
  [/regenerate|retry|again/i, RefreshCw],
  [/share/i, Share],
  [/info/i, Info],
]

export const APP_PARTS: Part[] = [
  {
    type: "icon-rail",
    label: "Icon rail",
    category: "Navigation",
    terms: "rail sidebar icons app navigation dock",
    container: { flow: "column", slotClass: () => "flex min-w-0 flex-1 flex-col" },
    defaults: () => ({ props: { items: "Home, Tables, SQL Editor, Database, Auth, Storage, Logs", footer: "Settings", active: 1 }, children: [] }),
    fields: [
      { key: "items", label: "Items (comma separated)", kind: "text" },
      { key: "footer", label: "Bottom items", kind: "text" },
      { key: "active", label: "Active item (1 = first)", kind: "number" },
    ],
    render: (p, slot) => {
      const item = (label: string, active: boolean) => {
        const Icon = iconFor(label)
        return (
          <div key={label} title={label} className={`flex size-9 items-center justify-center rounded-md ${active ? "bg-accent text-foreground" : "text-muted-foreground"}`}>
            <Icon className="size-[18px]" strokeWidth={1.75} />
          </div>
        )
      }
      return (
        <div className="flex min-h-[760px] w-full">
          <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-2">
            {list(p.items).map((x, i) => item(x, i + 1 === Number(p.active)))}
            <div className="mt-auto flex flex-col items-center gap-1">{list(p.footer).map((x) => item(x, false))}</div>
          </nav>
          {slot}
        </div>
      )
    },
    uses: ["tooltip"],
    code: (p, kids) =>
      `{/* Icon rail: ${list(p.items).map(esc).join(", ")}; bottom: ${list(p.footer).map(esc).join(", ")}. Tooltips show labels; the active item is highlighted. */}\n<div className="flex h-svh">\n  <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-2">\n    {items.map((item) => (\n      <Tooltip key={item.href}>\n        <TooltipTrigger asChild>\n          <a href={item.href} data-active={item.active} className="flex size-9 items-center justify-center rounded-md text-muted-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground">\n            <item.icon className="size-[18px]" />\n          </a>\n        </TooltipTrigger>\n        <TooltipContent side="right">{item.label}</TooltipContent>\n      </Tooltip>\n    ))}\n  </nav>\n  <div className="flex min-w-0 flex-1 flex-col">\n${kids}\n  </div>\n</div>`,
  },
  {
    type: "kanban",
    label: "Kanban board",
    category: "Data",
    terms: "board columns cards pipeline workflow trello",
    defaults: () => ({
      props: {
        columns: "Todo, In progress, Done",
        cards: "Design onboarding — High · Maya; Write release notes — Low | Fix login redirect — Urgent · Leo | Ship billing page — Medium",
        counts: "",
        addCard: true,
      },
    }),
    fields: [
      { key: "columns", label: "Columns (comma separated)", kind: "text" },
      { key: "cards", label: "Cards: ; between cards, | between columns, 'Title — meta · meta'", kind: "textarea" },
      { key: "counts", label: "Totals per column (optional)", kind: "text" },
      { key: "addCard", label: "Show + New", kind: "boolean" },
    ],
    render: (p) => {
      const cols = list(p.columns)
      const groups = s(p.cards).split("|").map((g) => g.split(";").map((c) => c.trim()).filter(Boolean))
      const counts = list(p.counts)
      return (
        <div className="flex w-full gap-3 overflow-hidden">
          {cols.map((col, i) => {
            const cards = groups[i] ?? []
            return (
              <div key={i} className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-lg bg-muted/50 p-2">
                <div className="flex items-center gap-2 px-1 py-1 text-sm font-medium">
                  {col}
                  <span className="text-xs text-muted-foreground tabular-nums">{counts[i] ?? cards.length}</span>
                  <Plus className="ml-auto size-3.5 text-muted-foreground" />
                </div>
                {cards.map((c, ci) => {
                  const [title, meta] = c.split("—").map((x) => x.trim())
                  return (
                    <div key={ci} className="grid gap-2 rounded-md border bg-card p-3 text-sm text-card-foreground shadow-xs">
                      <span className="leading-snug">{title}</span>
                      {meta && (
                        <div className="flex flex-wrap gap-1">
                          {meta.split("·").map((m, mi) => (
                            <Badge key={mi} variant="outline" className="font-normal">
                              {m.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                {p.addCard && <div className="px-1 py-1 text-xs text-muted-foreground">+ New</div>}
              </div>
            )
          })}
        </div>
      )
    },
    uses: ["badge"],
    code: (p) =>
      `{/* Board with columns ${list(p.columns).map(esc).join(", ")}; cards drag between columns (dnd-kit), each column scrolls on its own */}\n<div className="flex gap-3 overflow-x-auto">\n  {columns.map((column) => (\n    <div key={column.id} className="flex w-[260px] shrink-0 flex-col gap-2 rounded-lg bg-muted/50 p-2">\n      <div className="flex items-center gap-2 px-1 py-1 text-sm font-medium">\n        {column.name} <span className="text-xs text-muted-foreground">{column.cards.length}</span>\n      </div>\n      {column.cards.map((card) => (\n        <div key={card.id} className="grid gap-2 rounded-md border bg-card p-3 text-sm">\n          {card.title}\n          <div className="flex flex-wrap gap-1">{card.meta.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}</div>\n        </div>\n      ))}\n    </div>\n  ))}\n</div>`,
  },
  {
    type: "time-slots",
    label: "Time slots",
    category: "Forms",
    terms: "booking schedule calendar availability appointment",
    defaults: () => ({ props: { day: "Thu 19", slots: "9:00am, 9:30am, 10:00am, 11:30am, 1:00pm, 2:00pm", selected: 0, format: "12h, 24h" } }),
    fields: [
      { key: "day", label: "Day", kind: "text" },
      { key: "slots", label: "Slots (comma separated)", kind: "text" },
      { key: "selected", label: "Selected (1 = first, 0 = none)", kind: "number" },
      { key: "format", label: "Format toggle", kind: "text" },
    ],
    render: (p) => {
      const fmt = list(p.format)
      return (
        <div className="grid w-full gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{s(p.day)}</span>
            {fmt.length > 0 && (
              <ToggleGroup type="single" size="sm" variant="outline" defaultValue={fmt[0]}>
                {fmt.map((f, i) => (
                  <ToggleGroupItem key={i} value={f} className="px-2 text-xs">
                    {f}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          </div>
          <div className="grid gap-2">
            {list(p.slots).map((t, i) => (
              <Button key={i} variant={i + 1 === Number(p.selected) ? "default" : "outline"} className="w-full">
                {t}
              </Button>
            ))}
          </div>
        </div>
      )
    },
    uses: ["button", "toggle-group"],
    code: (p) =>
      `{/* Available times for ${esc(p.day)}; selecting one shows Next beside it */}\n<div className="grid gap-2">\n  {slots.map((slot) => (\n    <Button key={slot} variant={slot === selected ? "default" : "outline"} className="w-full" onClick={() => setSelected(slot)}>\n      {slot}\n    </Button>\n  ))}\n</div>`,
  },
  {
    type: "terminal",
    label: "Terminal",
    category: "AI",
    terms: "console shell output command logs",
    defaults: () => ({ props: { title: "Terminal", lines: "$ npm test\n PASS  src/app.test.ts\nTests: 12 passed", status: "done" } }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "lines", label: "Output ($ marks commands)", kind: "textarea" },
      { key: "status", label: "Status", kind: "select", options: ["running", "done", "error"] },
    ],
    render: (p) => {
      const st = s(p.status)
      return (
        <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2 font-mono text-xs">
            <span className={`size-2 rounded-full ${st === "error" ? "bg-red-500" : st === "running" ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`} />
            <span className="truncate text-zinc-400">{s(p.title)}</span>
          </div>
          <pre className="overflow-x-auto px-3 py-2.5 font-mono text-xs leading-relaxed">
            {s(p.lines)
              .split("\n")
              .map((l, i, all) => (
                <div key={i} className={l.startsWith("$ ") ? "text-zinc-50" : "text-zinc-400"}>
                  {l || " "}
                  {st === "running" && i === all.length - 1 && <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-zinc-300" />}
                </div>
              ))}
          </pre>
        </div>
      )
    },
    uses: [],
    code: (p) =>
      `{/* Terminal (${s(p.status)}): streams command output; commands start with $ */}\n<div className="overflow-hidden rounded-lg border bg-zinc-950 text-zinc-200">\n  <div className="border-b border-zinc-800 px-3 py-2 font-mono text-xs text-zinc-400">${esc(p.title)}</div>\n  <pre className="overflow-x-auto px-3 py-2.5 font-mono text-xs">{output}</pre>\n</div>`,
  },
  {
    type: "browser",
    label: "Browser preview",
    category: "AI",
    terms: "web preview iframe app url page",
    defaults: () => ({ props: { url: "http://localhost:5173", title: "Preview", label: "The app running in the agent's sandbox" } }),
    fields: [
      { key: "url", label: "URL", kind: "text" },
      { key: "title", label: "Tab title", kind: "text" },
      { key: "label", label: "What it shows", kind: "text" },
    ],
    render: (p) => (
      <div className="w-full overflow-hidden rounded-lg border bg-background">
        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-2 py-1.5 text-muted-foreground">
          <ArrowLeft className="size-3.5" />
          <ArrowRight className="size-3.5" />
          <RotateCw className="size-3.5" />
          <div className="ml-1 flex h-6 min-w-0 flex-1 items-center rounded-md bg-background px-2 font-mono text-xs text-foreground/80">
            <span className="truncate">{s(p.url)}</span>
          </div>
        </div>
        <div className="flex aspect-[16/10] items-center justify-center bg-muted/30 p-6 text-center text-xs text-muted-foreground">{s(p.label)}</div>
      </div>
    ),
    uses: [],
    code: (p) =>
      `{/* Live preview of ${esc(p.url)} in a sandboxed iframe, with back/forward/reload and the URL */}\n<div className="overflow-hidden rounded-lg border">\n  <div className="flex items-center gap-1.5 border-b bg-muted/40 px-2 py-1.5">\n    {/* back, forward, reload */}\n    <input readOnly value={url} className="h-6 flex-1 rounded-md bg-background px-2 font-mono text-xs" />\n  </div>\n  <iframe src={url} title="${esc(p.title)}" className="aspect-[16/10] w-full" sandbox="allow-scripts allow-same-origin" />\n</div>`,
  },
  {
    type: "file-tree",
    label: "File tree",
    category: "AI",
    terms: "files explorer changes repository folders",
    defaults: () => ({ props: { paths: "src/app.tsx, src/lib/api.ts, package.json", changed: "src/lib/api.ts=M", active: "src/lib/api.ts", summary: "1 changed" } }),
    fields: [
      { key: "paths", label: "Paths (comma separated)", kind: "textarea" },
      { key: "changed", label: "Changes: path=M|A|D", kind: "text" },
      { key: "active", label: "Active path", kind: "text" },
      { key: "summary", label: "Summary", kind: "text" },
    ],
    render: (p) => {
      const changed = Object.fromEntries(list(p.changed).map((x) => x.split("=").map((y) => y.trim())))
      // Build the visible rows: each folder once, then its files, indented by depth.
      const rows: { name: string; depth: number; path: string; dir: boolean }[] = []
      const seen = new Set<string>()
      for (const path of list(p.paths).sort()) {
        const parts = path.split("/")
        parts.forEach((name, i) => {
          const sub = parts.slice(0, i + 1).join("/")
          if (seen.has(sub)) return
          seen.add(sub)
          rows.push({ name, depth: i, path: sub, dir: i < parts.length - 1 })
        })
      }
      const color: Record<string, string> = { M: "text-amber-500", A: "text-emerald-600", D: "text-red-500" }
      return (
        <div className="grid w-full gap-0.5 text-sm">
          {p.summary && <div className="px-2 pb-1 text-xs text-muted-foreground">{s(p.summary)}</div>}
          {rows.map((r) => (
            <div
              key={r.path}
              className={`flex h-7 items-center gap-1.5 rounded-md pr-2 ${r.path === s(p.active) ? "bg-accent text-accent-foreground" : ""}`}
              style={{ paddingLeft: 8 + r.depth * 14 }}
            >
              {r.dir ? <Folder className="size-3.5 text-muted-foreground" /> : <File className="size-3.5 text-muted-foreground" />}
              <span className={`truncate ${changed[r.path] === "D" ? "line-through" : ""}`}>{r.name}</span>
              {changed[r.path] && <span className={`ml-auto font-mono text-xs ${color[changed[r.path]] ?? ""}`}>{changed[r.path]}</span>}
            </div>
          ))}
        </div>
      )
    },
    uses: [],
    code: (p) =>
      `{/* File tree built from paths; changed files show M/A/D; the open file is highlighted. e.g. ${list(p.paths).slice(0, 3).map(esc).join(", ")} */}\n<FileTree files={files} changes={changes} active={activePath} onSelect={openFile} />`,
  },
  {
    type: "message-actions",
    label: "Message actions",
    category: "AI",
    terms: "copy regenerate thumbs feedback branch reply actions",
    defaults: () => ({ props: { actions: "Copy, Edit, Read aloud, Good response, Bad response, Regenerate", branch: "2 / 3" } }),
    fields: [
      { key: "actions", label: "Actions (comma separated)", kind: "text" },
      { key: "branch", label: "Version pager (e.g. 2 / 3, empty to hide)", kind: "text" },
    ],
    render: (p) => (
      <div className="flex items-center gap-0.5 text-muted-foreground">
        {p.branch && (
          <span className="mr-1 flex items-center gap-0.5 text-xs tabular-nums">
            <ChevronLeft className="size-3.5" />
            {s(p.branch)}
            <ChevronRight className="size-3.5" />
          </span>
        )}
        {list(p.actions).map((a, i) => {
          const Icon = ACTION_ICONS.find(([re]) => re.test(a))?.[1] ?? Circle
          return (
            <Button key={i} variant="ghost" size="icon-sm" title={a} aria-label={a}>
              <Icon />
            </Button>
          )
        })}
      </div>
    ),
    uses: ["button", "tooltip"],
    code: (p) =>
      `{/* Under each assistant reply: ${list(p.actions).map(esc).join(", ")}${p.branch ? `; ‹ ${esc(p.branch)} › switches between regenerated versions` : ""}. Always visible on the latest reply, on hover for older ones. */}\n<div className="flex items-center gap-0.5 text-muted-foreground">\n  {actions.map((action) => (\n    <Tooltip key={action.label}>\n      <TooltipTrigger asChild>\n        <Button variant="ghost" size="icon-sm" onClick={action.run} aria-label={action.label}><action.icon /></Button>\n      </TooltipTrigger>\n      <TooltipContent>{action.label}</TooltipContent>\n    </Tooltip>\n  ))}\n</div>`,
  },
  {
    type: "roster",
    label: "Roster",
    category: "AI",
    terms: "inbox chats teammates contacts bots sidebar list unread status",
    defaults: () => ({
      props: {
        items: "Personal / Juno | Waiting on you | 9:41 AM | needs-you; Personal / Atlas | Working… | 9:38 AM | working; Team / Launch room | Deploy is green | 9:12 AM | group",
        active: 1,
        compact: false,
      },
    }),
    fields: [
      { key: "items", label: "Rows: 'Section / Name | preview | time | flag'; flag = working, needs-you, unread, error, group", kind: "textarea" },
      { key: "active", label: "Active row (1 = first, 0 = none)", kind: "number" },
      { key: "compact", label: "Compact", kind: "boolean" },
    ],
    render: (p) => {
      const rows = s(p.items)
        .split(";")
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => {
          const [who, preview = "", time = "", flag = ""] = r.split("|").map((x) => x.trim())
          const [section, name] = who.includes("/") ? who.split("/").map((x) => x.trim()) : ["", who]
          return { section, name, preview, time, flag }
        })
      const sections = [...new Set(rows.map((r) => r.section))]
      const tone: Record<string, string> = { working: "text-primary", "needs-you": "text-amber-600", error: "text-destructive" }
      let i = 0
      return (
        <div className="flex w-full min-w-0 flex-col gap-3">
          {sections.map((sec) => (
            <div key={sec} className="flex min-w-0 flex-col gap-0.5">
              {sec && (
                <div className="flex items-center gap-1 px-2 pb-1 text-xs font-medium text-muted-foreground">
                  <ChevronRight className="size-3 rotate-90" />
                  {sec}
                </div>
              )}
              {rows
                .filter((r) => r.section === sec)
                .map((r) => {
                  i++
                  const active = i === Number(p.active)
                  const initials = r.name.split(" ").map((w) => w[0]).join("").slice(0, 2)
                  return (
                    <div key={i} className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${active ? "bg-accent" : ""}`}>
                      <div className="relative shrink-0">
                        <div className={`flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium ${r.flag === "working" ? "ring-2 ring-primary/50" : ""}`}>
                          {r.flag === "group" ? "#" : initials}
                        </div>
                        {r.flag === "error" && <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background bg-destructive" />}
                      </div>
                      <div className="grid min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className={`truncate text-sm ${r.flag === "unread" || r.flag === "needs-you" ? "font-semibold" : "font-medium"}`}>{r.name}</span>
                          {!p.compact && r.time && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{r.time}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`truncate text-xs ${tone[r.flag] ?? "text-muted-foreground"}`}>{r.preview}</span>
                          {(r.flag === "unread" || r.flag === "needs-you") && <span className="ml-auto size-2 shrink-0 rounded-full bg-primary" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      )
    },
    uses: [],
    code: () =>
      `{/* Chats grouped by section; each row: avatar (status ring while working), name (bold when unread), live preview or status, time, unread dot. Sections fold. */}\n<nav className="grid gap-3">\n  {sections.map((section) => (\n    <div key={section.id} className="grid gap-0.5">\n      <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">{section.name}</div>\n      {section.chats.map((chat) => (\n        <a key={chat.id} href={chat.href} data-active={chat.id === activeId} className="flex items-center gap-2.5 rounded-lg px-2 py-2 data-[active=true]:bg-accent">\n          <Avatar className="size-8"><AvatarFallback>{chat.initials}</AvatarFallback></Avatar>\n          <div className="grid min-w-0 flex-1">\n            <span className="truncate text-sm font-medium">{chat.name}</span>\n            <span className="truncate text-xs text-muted-foreground">{chat.preview}</span>\n          </div>\n        </a>\n      ))}\n    </div>\n  ))}\n</nav>`,
  },
  {
    type: "computer-screen",
    label: "Computer screen",
    category: "AI",
    terms: "remote desktop browser agent computer use sandbox live view",
    defaults: () => ({ props: { title: "Agent's computer", url: "example.com/checkout", page: "Checkout form, Pay button highlighted", state: "running", control: "bot", size: "preview" } }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "url", label: "URL", kind: "text" },
      { key: "page", label: "What's on screen", kind: "text" },
      { key: "state", label: "State", kind: "select", options: ["running", "asleep", "booting", "stopped"] },
      { key: "control", label: "Control", kind: "select", options: ["bot", "you", "needs-you"] },
      { key: "size", label: "Size", kind: "select", options: ["preview", "full"] },
    ],
    render: (p) => {
      const st = s(p.state)
      const full = p.size === "full"
      return (
        <div className={`relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${full ? "min-h-[600px]" : ""}`}>
          <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
            <span className="flex gap-1">
              <i className="size-2 rounded-full bg-zinc-600" />
              <i className="size-2 rounded-full bg-zinc-600" />
              <i className="size-2 rounded-full bg-zinc-600" />
            </span>
            <div className="ml-1 min-w-0 flex-1 truncate rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-300">{s(p.url)}</div>
            {p.control === "you" && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">You have control</span>}
            {p.control === "needs-you" && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">Needs you</span>}
          </div>
          <div className={`flex items-center justify-center bg-zinc-100 p-6 text-center text-xs text-zinc-500 dark:bg-zinc-800 ${full ? "min-h-[560px]" : "aspect-[16/10]"}`}>
            {st === "running" ? (
              s(p.page)
            ) : st === "booting" ? (
              <span className="flex items-center gap-2">
                <RotateCw className="size-3.5 animate-spin" /> Booting live desktop…
              </span>
            ) : (
              <span className="grid justify-items-center gap-2">
                {st === "asleep" ? "Asleep" : "Computer is stopped"}
                <Button size="sm" variant="outline">
                  {st === "asleep" ? "Wake" : "Start"}
                </Button>
              </span>
            )}
          </div>
        </div>
      )
    },
    uses: ["button"],
    code: (p) =>
      `{/* The agent's live computer (${esc(p.state)}): streamed desktop with browser chrome; input is ignored until "Take control". ${p.size === "full" ? "Fills the window." : "Thumbnail; click opens the full view."} */}\n<div className="overflow-hidden rounded-xl border bg-zinc-900">\n  <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2 font-mono text-xs text-zinc-300">{url}</div>\n  <ComputerStream sessionId={sessionId} className="${p.size === "full" ? "h-[calc(100svh-3rem)]" : "aspect-[16/10]"} w-full" />\n</div>`,
  },
  {
    type: "nav",
    label: "Nav list",
    category: "Navigation",
    terms: "sidebar menu navigation links icons items",
    defaults: () => ({ props: { title: "", items: "Home, Playground, Usage, API Keys, Billing, Settings", active: 1, counts: "", icons: true } }),
    fields: [
      { key: "title", label: "Section title", kind: "text" },
      { key: "items", label: "Items (comma separated)", kind: "text" },
      { key: "active", label: "Active item (1 = first, 0 = none)", kind: "number" },
      { key: "counts", label: "Counts (comma separated, optional)", kind: "text" },
      { key: "icons", label: "Icons", kind: "boolean" },
    ],
    render: (p) => {
      const counts = list(p.counts)
      return (
        <nav className="grid w-full gap-0.5">
          {p.title && <div className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">{s(p.title)}</div>}
          {list(p.items).map((x, i) => {
            const Icon = iconFor(x)
            const active = i + 1 === Number(p.active)
            return (
              <div key={i} className={`flex h-8 items-center gap-2.5 rounded-md px-2 text-sm ${active ? "bg-accent font-medium text-accent-foreground" : "text-foreground/80"}`}>
                {p.icons && <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />}
                <span className="truncate">{x}</span>
                {counts[i] && <span className="ml-auto text-xs text-muted-foreground tabular-nums">{counts[i]}</span>}
              </div>
            )
          })}
        </nav>
      )
    },
    uses: [],
    code: (p) =>
      `<nav className="grid gap-0.5">\n${p.title ? `  <div className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">${esc(p.title)}</div>\n` : ""}  {items.map((item) => (\n    <a key={item.href} href={item.href} data-active={item.active} className="flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-foreground/80 hover:bg-accent data-[active=true]:bg-accent data-[active=true]:font-medium">\n      <item.icon className="size-4 text-muted-foreground" />\n      {item.label}\n    </a>\n  ))}\n</nav>\n{/* items: ${list(p.items).map(esc).join(", ")} */}`,
  },
  {
    type: "setting-row",
    label: "Setting row",
    category: "Forms",
    terms: "settings key value row field preference edit",
    defaults: () => ({ props: { label: "Billing email", description: "Invoices and receipts are sent here", value: "olivia@acme.com", control: "button", action: "Edit" } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
      { key: "value", label: "Value", kind: "text" },
      { key: "control", label: "Control", kind: "select", options: ["none", "button", "switch", "segmented", "badge", "avatar"] },
      { key: "action", label: "Action (button label, or options for segmented)", kind: "text" },
    ],
    render: (p) => {
      const c = s(p.control)
      return (
        <div className="flex w-full items-center justify-between gap-6 border-b py-3.5">
          <div className="grid min-w-0 gap-0.5">
            <span className="text-sm text-muted-foreground">{s(p.label)}</span>
            {p.value && c !== "avatar" && c !== "badge" && <span className="truncate text-sm font-medium">{s(p.value)}</span>}
            {p.description && <span className="text-xs text-muted-foreground">{s(p.description)}</span>}
          </div>
          <div className="shrink-0">
            {c === "button" && (
              <Button variant="outline" size="sm">
                {s(p.action) || "Edit"}
              </Button>
            )}
            {c === "switch" && <span className="inline-flex h-5 w-9 items-center rounded-full bg-primary p-0.5"><span className="ml-auto size-4 rounded-full bg-background" /></span>}
            {c === "segmented" && (
              <ToggleGroup type="single" variant="outline" size="sm" defaultValue={list(p.action)[0]}>
                {list(p.action).map((o, i) => (
                  <ToggleGroupItem key={i} value={o} className="px-2.5 text-xs">
                    {o}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
            {c === "badge" && <Badge variant="secondary">{s(p.value)}</Badge>}
            {c === "avatar" && (
              <span className="flex items-center gap-2 text-sm">
                <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">{s(p.value).slice(0, 1)}</span>
                {s(p.value)}
              </span>
            )}
          </div>
        </div>
      )
    },
    uses: ["button"],
    code: (p) =>
      `<div className="flex items-center justify-between gap-6 border-b py-3.5">\n  <div className="grid gap-0.5">\n    <span className="text-sm text-muted-foreground">${esc(p.label)}</span>\n${p.value ? `    <span className="text-sm font-medium">${esc(p.value)}</span>\n` : ""}${p.description ? `    <span className="text-xs text-muted-foreground">${esc(p.description)}</span>\n` : ""}  </div>\n  {/* ${esc(p.control)}${p.action ? `: ${esc(p.action)}` : ""} */}\n</div>`,
  },
  {
    type: "account",
    label: "Account",
    category: "Navigation",
    terms: "profile user org switcher avatar menu footer",
    defaults: () => ({ props: { name: "Vittorio Org", detail: "Org admin", variant: "row" } }),
    fields: [
      { key: "name", label: "Name", kind: "text" },
      { key: "detail", label: "Detail (role, plan, email)", kind: "text" },
      { key: "variant", label: "Style", kind: "select", options: ["row", "card", "avatar"] },
    ],
    render: (p) => {
      const initials = s(p.name).split(" ").map((w) => w[0]).join("").slice(0, 2)
      const mark = <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">{initials}</span>
      if (p.variant === "avatar")
        return <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">{initials}</span>
      return (
        <div className={`flex w-full items-center gap-2.5 ${p.variant === "card" ? "rounded-lg border bg-card p-2.5" : "rounded-md px-1 py-1"}`}>
          {mark}
          <div className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-sm font-medium">{s(p.name)}</span>
            {p.detail && <span className="truncate text-xs text-muted-foreground">{s(p.detail)}</span>}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </div>
      )
    },
    uses: ["dropdown-menu", "avatar"],
    code: (p) =>
      `{/* Account switcher: opens a menu with profile, organizations, settings and log out */}\n<DropdownMenu>\n  <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md p-1 text-left hover:bg-accent">\n    <Avatar className="size-8 rounded-md"><AvatarFallback>${esc(s(p.name).slice(0, 1))}</AvatarFallback></Avatar>\n    <div className="grid flex-1 leading-tight">\n      <span className="text-sm font-medium">${esc(p.name)}</span>\n      <span className="text-xs text-muted-foreground">${esc(p.detail)}</span>\n    </div>\n    <ChevronsUpDownIcon className="size-4 text-muted-foreground" />\n  </DropdownMenuTrigger>\n</DropdownMenu>`,
  },
  {
    type: "activity",
    label: "Activity line",
    category: "AI",
    terms: "collapsed steps ran commands tool summary disclosure",
    defaults: () => ({ props: { summary: "Ran 2 commands (1 failed)", items: "", open: false, file: "" } }),
    fields: [
      { key: "summary", label: "Summary", kind: "text" },
      { key: "file", label: "File chip (optional)", kind: "text" },
      { key: "open", label: "Expanded", kind: "boolean" },
      { key: "items", label: "Steps when expanded (comma separated)", kind: "text" },
    ],
    render: (p) => (
      <div className="grid w-full gap-1.5">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {s(p.summary)}
          {p.file && <span className="font-medium text-foreground">{s(p.file)}</span>}
          <ChevronRight className={`size-3.5 transition-transform ${p.open ? "rotate-90" : ""}`} />
        </div>
        {p.open && (
          <div className="ml-1 grid gap-1 border-l pl-3 font-mono text-xs text-muted-foreground">
            {list(p.items).map((x, i) => (
              <span key={i}>{x}</span>
            ))}
          </div>
        )}
      </div>
    ),
    uses: ["collapsible"],
    code: (p) =>
      `{/* Collapsed group of agent steps; click to expand the commands and their output */}\n<Collapsible>\n  <CollapsibleTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">\n    ${esc(p.summary)}${p.file ? ` <span className="font-medium text-foreground">${esc(p.file)}</span>` : ""} <ChevronRightIcon className="size-3.5" />\n  </CollapsibleTrigger>\n  <CollapsibleContent>{steps}</CollapsibleContent>\n</Collapsible>`,
  },
  {
    type: "bar-list",
    label: "Bar list",
    category: "Data",
    terms: "top list ranking breakdown horizontal bars referrers",
    defaults: () => ({ props: { items: "Direct — 4820, Google — 3140, Newsletter — 1290, GitHub — 860, X — 410", unit: "" } }),
    fields: [
      { key: "items", label: "Rows: 'Label — value', comma separated", kind: "textarea" },
      { key: "unit", label: "Unit (e.g. %, ms, $)", kind: "text" },
    ],
    render: (p) => {
      const rows = list(p.items).map((x) => {
        const [label, v] = x.split("—").map((y) => y.trim())
        return { label, v: Number(String(v ?? "0").replace(/[^\d.]/g, "")) || 0, raw: v ?? "" }
      })
      const max = Math.max(1, ...rows.map((r) => r.v))
      return (
        <div className="grid w-full gap-1.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="relative h-7 flex-1 overflow-hidden rounded-md">
                <div className="absolute inset-y-0 left-0 rounded-md bg-muted" style={{ width: `${(r.v / max) * 100}%` }} />
                <span className="relative flex h-full items-center px-2 truncate">{r.label}</span>
              </div>
              <span className="w-16 shrink-0 text-right text-muted-foreground tabular-nums">
                {r.raw}
                {s(p.unit)}
              </span>
            </div>
          ))}
        </div>
      )
    },
    uses: [],
    code: (p) =>
      `{/* Ranked list with proportional bars, sorted by value. e.g. ${list(p.items).slice(0, 3).map(esc).join(", ")} */}\n<div className="grid gap-1.5">\n  {rows.map((row) => (\n    <div key={row.label} className="flex items-center gap-3 text-sm">\n      <div className="relative h-7 flex-1 overflow-hidden rounded-md">\n        <div className="absolute inset-y-0 left-0 rounded-md bg-muted" style={{ width: \`\${(row.value / max) * 100}%\` }} />\n        <span className="relative flex h-full items-center px-2">{row.label}</span>\n      </div>\n      <span className="w-16 text-right text-muted-foreground tabular-nums">{row.value}</span>\n    </div>\n  ))}\n</div>`,
  },
  {
    type: "review-bar",
    label: "Review bar",
    category: "AI",
    terms: "accept reject inline diff changes agent edits hunk",
    defaults: () => ({ props: { position: "1 / 3", reject: "Reject ⌘N", accept: "Accept ⌘Y" } }),
    fields: [
      { key: "position", label: "Position (e.g. 1 / 3)", kind: "text" },
      { key: "reject", label: "Reject label", kind: "text" },
      { key: "accept", label: "Accept label", kind: "text" },
    ],
    render: (p) => (
      <div className="inline-flex items-center gap-1 rounded-lg border bg-popover p-1 text-xs shadow-sm">
        {p.position && (
          <span className="flex items-center gap-0.5 px-1.5 text-muted-foreground tabular-nums">
            <ChevronUp className="size-3.5" />
            {s(p.position)}
            <ChevronDown className="size-3.5" />
          </span>
        )}
        <span className="rounded-md px-2 py-1 text-destructive">{s(p.reject)}</span>
        <span className="rounded-md bg-emerald-600 px-2 py-1 font-medium text-white">{s(p.accept)}</span>
      </div>
    ),
    uses: ["button"],
    code: (p) =>
      `{/* Floats over an agent's inline edit: step through hunks (${esc(p.position)}), reject or accept each */}\n<div className="inline-flex items-center gap-1 rounded-lg border bg-popover p-1 text-xs shadow-sm">\n  <Button size="xs" variant="ghost">${esc(p.reject)}</Button>\n  <Button size="xs">${esc(p.accept)}</Button>\n</div>`,
  },
  {
    type: "welcome",
    label: "Welcome",
    category: "AI",
    terms: "empty state hero greeting lets build new thread logo",
    defaults: () => ({ props: { title: "Let's build", subtitle: "", chip: "acme/web", glyph: "terminal" } }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "subtitle", label: "Subtitle", kind: "text" },
      { key: "chip", label: "Context chip (project, repo…)", kind: "text" },
      { key: "glyph", label: "Glyph", kind: "select", options: ["terminal", "sparkles", "none"] },
    ],
    render: (p) => (
      <div className="grid w-full justify-items-center gap-3 py-6 text-center">
        {p.glyph !== "none" && (
          <span className="flex size-12 items-center justify-center rounded-2xl border bg-background shadow-xs">
            {p.glyph === "sparkles" ? <Sparkles className="size-5" /> : <Terminal className="size-5" />}
          </span>
        )}
        <div className="text-2xl font-semibold tracking-tight">{s(p.title)}</div>
        {p.subtitle && <p className="max-w-sm text-sm text-muted-foreground">{s(p.subtitle)}</p>}
        {p.chip && (
          <span className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs">
            <Folder className="size-3.5 text-muted-foreground" />
            {s(p.chip)}
            <ChevronDown className="size-3 text-muted-foreground" />
          </span>
        )}
      </div>
    ),
    uses: [],
    code: (p) =>
      `<div className="grid justify-items-center gap-3 text-center">\n  {/* app glyph */}\n  <h1 className="text-2xl font-semibold tracking-tight">${esc(p.title)}</h1>\n${p.subtitle ? `  <p className="text-sm text-muted-foreground">${esc(p.subtitle)}</p>\n` : ""}${p.chip ? `  {/* project picker chip: ${esc(p.chip)} */}\n` : ""}</div>`,
  },
]
