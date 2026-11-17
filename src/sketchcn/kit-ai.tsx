// Agentic UI parts, built on shadcn's AI components: message, bubble, trace,
// code-block, attachment, questionnaire, marker and input-group.

import { ArrowUp, AtSign, Brain, ChevronDown, GitBranch, Image, Infinity, Mic, Plus, Check, CircleDot, FileText, Globe, ShieldCheck, Sparkles, TriangleAlert, Wrench, X } from "lucide-react"
import type { Part } from "./kit-base"
import { esc, indent, list, s } from "./kit-base"
import { Attachment, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from "@/components/ui/attachment"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { CodeBlock, CodeBlockActions, CodeBlockContent, CodeBlockHeader, CodeBlockLine, CodeBlockTitle } from "@/components/ui/code-block"
import { Spinner } from "@/components/ui/spinner"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { Message, MessageAvatar, MessageContent, MessageGroup, MessageHeader } from "@/components/ui/message"
import {
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireItem,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire"
import { Trace, TraceDescription, TraceIcon, TraceLine, TraceTitle } from "@/components/ui/trace"

const STATUS: Record<string, "running" | "error" | undefined> = { running: "running", error: "error", done: undefined }

export const AI_PARTS: Part[] = [
  {
    type: "conversation",
    label: "Conversation",
    category: "AI",
    terms: "chat thread messages agent",
    container: { flow: "column", slotClass: () => "flex flex-col gap-6" },
    defaults: () => ({ props: {}, children: [] }),
    fields: [],
    render: (_p, slot) => <MessageGroup className="w-full gap-6">{slot}</MessageGroup>,
    uses: ["message", "message-scroller"],
    code: (_p, kids) =>
      `{/* Scrolls to the newest message; stick to bottom while streaming */}\n<MessageScroller>\n  <MessageScrollerViewport>\n    <MessageScrollerContent className="flex flex-col gap-6">\n${indent(
        kids,
        3,
      )}\n    </MessageScrollerContent>\n  </MessageScrollerViewport>\n</MessageScroller>`,
  },
  {
    type: "message",
    label: "Message",
    category: "AI",
    terms: "chat bubble user assistant reply",
    defaults: () => ({ props: { role: "assistant", text: "Here's a summary of last week's revenue by region.", name: "Assistant" } }),
    fields: [
      { key: "role", label: "From", kind: "select", options: ["user", "assistant"] },
      { key: "text", label: "Text", kind: "textarea" },
      { key: "name", label: "Name", kind: "text" },
    ],
    render: (p) => {
      const user = p.role === "user"
      return (
        <Message align={user ? "end" : "start"}>
          {!user && (
            <MessageAvatar>
              <Avatar className="size-8">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            </MessageAvatar>
          )}
          <MessageContent>
            {!user && p.name && <MessageHeader>{s(p.name)}</MessageHeader>}
            <Bubble variant={user ? "default" : "ghost"} align={user ? "end" : "start"}>
              <BubbleContent>{s(p.text)}</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      )
    },
    uses: ["message", "bubble", "avatar"],
    code: (p) => {
      const user = p.role === "user"
      return user
        ? `<Message align="end">\n  <MessageContent>\n    <Bubble align="end">\n      <BubbleContent>${esc(p.text)}</BubbleContent>\n    </Bubble>\n  </MessageContent>\n</Message>`
        : `<Message>\n  <MessageAvatar>\n    <Avatar><AvatarFallback>AI</AvatarFallback></Avatar>\n  </MessageAvatar>\n  <MessageContent>\n${
            p.name ? `    <MessageHeader>${esc(p.name)}</MessageHeader>\n` : ""
          }    <Bubble variant="ghost">\n      {/* streamed markdown */}\n      <BubbleContent>${esc(p.text)}</BubbleContent>\n    </Bubble>\n  </MessageContent>\n</Message>`
    },
  },
  {
    type: "prompt",
    label: "Prompt input",
    category: "AI",
    terms: "composer chat input send textarea model ask",
    defaults: () => ({ props: { variant: "box", placeholder: "Ask anything…", model: "Claude Opus 5.5", attach: true, modes: "", branch: "", footer: "", mic: false } }),
    fields: [
      { key: "variant", label: "Style", kind: "select", options: ["box", "pill", "agent"] },
      { key: "placeholder", label: "Placeholder", kind: "text" },
      { key: "model", label: "Model picker", kind: "text" },
      { key: "attach", label: "Attach (+)", kind: "boolean" },
      { key: "mic", label: "Microphone", kind: "boolean" },
      { key: "modes", label: "Modes under it (e.g. Local, Worktree, Cloud)", kind: "text" },
      { key: "branch", label: "Branch chip", kind: "text" },
      { key: "footer", label: "Footer text (e.g. Opus 5.5 · Medium · Auto)", kind: "text" },
    ],
    render: (p) => {
      const v = s(p.variant) || "box"
      const modes = list(p.modes)
      const below =
        modes.length > 0 || p.branch || p.footer ? (
          <div className="flex items-center gap-3 px-2 pt-2 text-xs">
            {modes.map((m, i) => (
              <span key={i} className={i === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>
                {m}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-3 text-muted-foreground">
              {p.footer && <span>{s(p.footer)}</span>}
              {p.branch && (
                <span className="flex items-center gap-1">
                  <GitBranch className="size-3.5" />
                  {s(p.branch)}
                </span>
              )}
            </span>
          </div>
        ) : null
      if (v === "pill") {
        return (
          <div className="w-full">
            <div className="flex h-12 items-center gap-2 rounded-2xl border bg-background px-3 shadow-xs">
              {p.attach && <Plus className="size-4 text-muted-foreground" />}
              <span className="flex-1 truncate text-sm text-muted-foreground">{s(p.placeholder)}</span>
              {p.mic && <Mic className="size-4 text-muted-foreground" />}
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ArrowUp className="size-3.5" />
              </span>
            </div>
            {below}
          </div>
        )
      }
      if (v === "agent") {
        return (
          <div className="w-full">
            <div className="grid gap-2 rounded-xl border bg-background p-2.5 shadow-xs">
              <span className="flex w-fit items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground">
                <AtSign className="size-3" /> Add context
              </span>
              <span className="min-h-10 px-0.5 text-sm text-muted-foreground">{s(p.placeholder)}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-medium">
                  <Infinity className="size-3.5" /> Agent <ChevronDown className="size-3 opacity-60" />
                </span>
                {p.model && <span className="text-muted-foreground">{s(p.model)}</span>}
                <span className="ml-auto flex items-center gap-2 text-muted-foreground">
                  {p.attach && <Image className="size-3.5" />}
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ArrowUp className="size-3.5" />
                  </span>
                </span>
              </div>
            </div>
            {below}
          </div>
        )
      }
      return (
        <div className="w-full">
          <InputGroup className="rounded-xl">
            <InputGroupTextarea placeholder={s(p.placeholder)} className="min-h-16" tabIndex={-1} />
            <InputGroupAddon align="block-end" className="gap-1">
              {p.attach && (
                <InputGroupButton size="icon-xs" variant="ghost" className="rounded-full">
                  <Plus />
                </InputGroupButton>
              )}
              {p.model && (
                <InputGroupButton size="xs" variant="ghost">
                  {s(p.model)}
                </InputGroupButton>
              )}
              {p.mic && (
                <InputGroupButton size="icon-xs" variant="ghost" className="ml-auto rounded-full">
                  <Mic />
                </InputGroupButton>
              )}
              <InputGroupButton size="icon-xs" variant="default" className={`${p.mic ? "" : "ml-auto"} rounded-full`}>
                <ArrowUp />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {below}
        </div>
      )
    },
    uses: ["input-group"],
    code: (p) => {
      const extras = [
        list(p.modes).length ? `Modes under the box: ${list(p.modes).map(esc).join(" / ")} (first selected)` : "",
        p.branch ? `branch chip "${esc(p.branch)}" on the right` : "",
        p.footer ? `footer "${esc(p.footer)}"` : "",
        p.mic ? "mic button for dictation" : "",
      ].filter(Boolean)
      return `{/* Composer (${s(p.variant) || "box"} style). Enter sends, Shift+Enter adds a line; Send becomes Stop while streaming.${extras.length ? " " + extras.join("; ") + "." : ""} */}\n<InputGroup className="${s(p.variant) === "pill" ? "rounded-2xl" : "rounded-xl"}">\n  <InputGroupTextarea placeholder="${esc(p.placeholder)}" />\n  <InputGroupAddon align="block-end">\n${
        p.attach ? `    <InputGroupButton size="icon-xs" variant="ghost" aria-label="Add"><PlusIcon /></InputGroupButton>\n` : ""
      }${p.model ? `    <InputGroupButton size="xs" variant="ghost">${esc(p.model)}</InputGroupButton>\n` : ""}    <InputGroupButton size="icon-xs" className="ml-auto rounded-full" aria-label="Send"><ArrowUpIcon /></InputGroupButton>\n  </InputGroupAddon>\n</InputGroup>`
    },
  },
  {
    type: "suggestions",
    label: "Suggestions",
    category: "AI",
    terms: "chips prompts starters quick replies",
    defaults: () => ({ props: { items: "Summarize this week, Find churn risks, Draft a reply" } }),
    fields: [{ key: "items", label: "Suggestions (comma separated)", kind: "text" }],
    render: (p) => (
      <div className="flex flex-wrap gap-2">
        {list(p.items).map((x, ki) => (
          <Button key={ki} variant="outline" size="sm" className="rounded-full">
            {x}
          </Button>
        ))}
      </div>
    ),
    uses: ["button"],
    code: (p) =>
      `<div className="flex flex-wrap gap-2">\n${list(p.items)
        .map((x) => `  <Button variant="outline" size="sm" className="rounded-full" onClick={() => send("${esc(x)}")}>${esc(x)}</Button>`)
        .join("\n")}\n</div>`,
  },
  {
    type: "reasoning",
    label: "Reasoning",
    category: "AI",
    terms: "thinking thoughts chain of thought",
    defaults: () => ({ props: { title: "Thought for 6 seconds", status: "done", detail: "Compared revenue by region against the previous week." } }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "status", label: "Status", kind: "select", options: ["running", "done"] },
      { key: "detail", label: "Thoughts", kind: "textarea" },
    ],
    render: (p) => (
      <Trace>
        <div>
          <TraceLine status={STATUS[s(p.status)]}>
            <TraceIcon>
              <Brain />
            </TraceIcon>
            <TraceTitle>{p.status === "running" ? "Thinking…" : s(p.title)}</TraceTitle>
          </TraceLine>
        </div>
        {p.detail && p.status !== "running" && <p className="ml-[7px] border-l pl-4 text-sm leading-relaxed text-muted-foreground">{s(p.detail)}</p>}
      </Trace>
    ),
    uses: ["trace"],
    code: (p) =>
      `<Trace>\n  <TraceCollapsible>\n    <TraceCollapsibleTrigger>\n      <TraceLine${p.status === "running" ? ` status="running"` : ""}>\n        <TraceIcon><BrainIcon /></TraceIcon>\n        <TraceTitle>${
        p.status === "running" ? "Thinking…" : esc(p.title)
      }</TraceTitle>\n      </TraceLine>\n    </TraceCollapsibleTrigger>\n    <TraceCollapsibleContent>${esc(p.detail)}</TraceCollapsibleContent>\n  </TraceCollapsible>\n</Trace>`,
  },
  {
    type: "tool",
    label: "Tool call",
    category: "AI",
    terms: "function call agent step action mcp",
    defaults: () => ({ props: { name: "search_orders", status: "done", detail: "128 rows", args: '{ "region": "EU", "since": "2026-11-10" }' } }),
    fields: [
      { key: "name", label: "Tool", kind: "text" },
      { key: "status", label: "Status", kind: "select", options: ["running", "done", "error"] },
      { key: "detail", label: "Result summary", kind: "text" },
      { key: "args", label: "Input", kind: "textarea" },
    ],
    render: (p) => {
      const st = s(p.status)
      return (
        <Trace>
          <div>
            <TraceLine status={STATUS[st]}>
              <TraceIcon>{st === "error" ? <TriangleAlert /> : st === "done" ? <Check /> : <Wrench />}</TraceIcon>
              <TraceTitle className="font-mono text-[0.8rem]">{s(p.name)}</TraceTitle>
              {p.detail && st !== "running" && <TraceDescription>{s(p.detail)}</TraceDescription>}
            </TraceLine>
          </div>
          {p.args && (
            <CodeBlock size="sm" className="ml-6 w-auto">
              <CodeBlockContent>{s(p.args)}</CodeBlockContent>
            </CodeBlock>
          )}
        </Trace>
      )
    },
    uses: ["trace", "code-block"],
    code: (p) =>
      `<Trace>\n  <TraceCollapsible>\n    <TraceCollapsibleTrigger>\n      <TraceLine${p.status === "done" ? "" : ` status="${s(p.status)}"`}>\n        <TraceIcon><WrenchIcon /></TraceIcon>\n        <TraceTitle>${esc(
        p.name,
      )}</TraceTitle>\n${p.detail ? `        <TraceDescription>${esc(p.detail)}</TraceDescription>\n` : ""}      </TraceLine>\n    </TraceCollapsibleTrigger>\n    <TraceCollapsibleContent>\n      <CodeBlock size="sm">\n        <CodeBlockContent>{JSON.stringify(input, null, 2)}</CodeBlockContent>\n      </CodeBlock>\n    </TraceCollapsibleContent>\n  </TraceCollapsible>\n</Trace>`,
  },
  {
    type: "code",
    label: "Code block",
    category: "AI",
    terms: "snippet syntax highlight artifact",
    defaults: () => ({ props: { title: "query.sql", code: "select region, sum(total) as revenue\nfrom orders\ngroup by region;" } }),
    fields: [
      { key: "title", label: "File name", kind: "text" },
      { key: "code", label: "Code", kind: "textarea" },
    ],
    render: (p) => (
      <CodeBlock>
        {p.title && (
          <CodeBlockHeader>
            <CodeBlockTitle>{s(p.title)}</CodeBlockTitle>
          </CodeBlockHeader>
        )}
        <CodeBlockContent lineNumbers>{s(p.code)}</CodeBlockContent>
      </CodeBlock>
    ),
    uses: ["code-block"],
    code: (p) =>
      `<CodeBlock>\n${p.title ? `  <CodeBlockHeader>\n    <CodeBlockTitle>${esc(p.title)}</CodeBlockTitle>\n    <CodeBlockActions><CodeBlockCopyButton /></CodeBlockActions>\n  </CodeBlockHeader>\n` : ""}  <CodeBlockContent lineNumbers>{code}</CodeBlockContent>\n</CodeBlock>`,
  },
  {
    type: "attachment",
    label: "Attachment",
    category: "AI",
    terms: "file upload document",
    defaults: () => ({ props: { name: "q3-report.pdf", meta: "PDF · 2.4 MB", state: "done" } }),
    fields: [
      { key: "name", label: "File name", kind: "text" },
      { key: "meta", label: "Details", kind: "text" },
      { key: "state", label: "State", kind: "select", options: ["done", "uploading", "processing", "error"] },
    ],
    render: (p) => (
      <Attachment state={s(p.state) as "done"} className="w-fit">
        <AttachmentMedia>
          <FileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{s(p.name)}</AttachmentTitle>
          <AttachmentDescription>{p.state === "uploading" ? "Uploading…" : p.state === "processing" ? "Processing…" : s(p.meta)}</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    ),
    uses: ["attachment"],
    code: (p) =>
      `<Attachment state="${s(p.state)}">\n  <AttachmentMedia><FileTextIcon /></AttachmentMedia>\n  <AttachmentContent>\n    <AttachmentTitle>${esc(p.name)}</AttachmentTitle>\n    <AttachmentDescription>${esc(p.meta)}</AttachmentDescription>\n  </AttachmentContent>\n</Attachment>`,
  },
  {
    type: "sources",
    label: "Sources",
    category: "AI",
    terms: "citations references links web",
    defaults: () => ({ props: { items: "stripe.com/docs, vercel.com/blog, arxiv.org" } }),
    fields: [{ key: "items", label: "Sources (comma separated)", kind: "text" }],
    render: (p) => (
      <div className="flex flex-wrap items-center gap-1.5">
        {list(p.items).map((x, i) => (
          <span key={x} className="inline-flex h-6 items-center gap-1.5 rounded-full bg-muted px-2 text-xs text-muted-foreground">
            <span className="flex size-4 items-center justify-center rounded-full bg-background text-[10px] font-medium text-foreground tabular-nums">{i + 1}</span>
            <Globe className="size-3" />
            {x}
          </span>
        ))}
      </div>
    ),
    uses: [],
    code: (p) =>
      `<div className="flex flex-wrap gap-1.5">\n  {sources.map((source, i) => (\n    <a key={source.url} href={source.url} className="inline-flex h-6 items-center gap-1.5 rounded-full bg-muted px-2 text-xs text-muted-foreground">\n      {i + 1} · {source.title}\n    </a>\n  ))}\n</div>\n{/* e.g. ${list(p.items).map(esc).join(", ")} */}`,
  },
  {
    type: "questionnaire",
    label: "Agent question",
    category: "AI",
    terms: "questionnaire ask user choice clarify human in the loop",
    defaults: () => ({ props: { question: "Which regions should I include?", choices: "Europe, North America, Asia Pacific", multiple: true } }),
    fields: [
      { key: "question", label: "Question", kind: "text" },
      { key: "choices", label: "Choices (comma separated)", kind: "text" },
      { key: "multiple", label: "Multiple answers", kind: "boolean" },
    ],
    render: (p) => {
      const choices = list(p.choices)
      return (
        <Questionnaire shortcuts="numbers" className="max-w-md">
          <QuestionnaireItem name="q1" multiple={!!p.multiple}>
            <QuestionnaireTitle>{s(p.question)}</QuestionnaireTitle>
            <QuestionnaireChoices>
              {choices.map((c, i) => (
                <QuestionnaireChoice key={c} value={c} defaultChecked={i === 0} tabIndex={-1}>
                  {c}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
          </QuestionnaireItem>
        </Questionnaire>
      )
    },
    uses: ["questionnaire"],
    code: (p) =>
      `{/* The agent pauses until the user answers; send the answer back as a tool result */}\n<Questionnaire shortcuts="numbers" onSubmit={answer}>\n  <QuestionnaireItem name="regions"${p.multiple ? " multiple" : ""}>\n    <QuestionnaireTitle>${esc(p.question)}</QuestionnaireTitle>\n    <QuestionnaireChoices>\n${list(p.choices)
        .map((c) => `      <QuestionnaireChoice value="${esc(c).toLowerCase()}">${esc(c)}</QuestionnaireChoice>`)
        .join("\n")}\n    </QuestionnaireChoices>\n  </QuestionnaireItem>\n  <QuestionnaireActions>\n    <QuestionnaireSubmit>Continue</QuestionnaireSubmit>\n  </QuestionnaireActions>\n</Questionnaire>`,
  },
  {
    type: "marker",
    label: "Marker",
    category: "AI",
    terms: "divider timestamp event system message",
    defaults: () => ({ props: { text: "Today", variant: "separator" } }),
    fields: [
      { key: "text", label: "Text", kind: "text" },
      { key: "variant", label: "Variant", kind: "select", options: ["separator", "default", "border"] },
    ],
    render: (p) => (
      <Marker variant={s(p.variant) as "separator"}>
        <MarkerContent>{s(p.text)}</MarkerContent>
      </Marker>
    ),
    uses: ["marker"],
    code: (p) => `<Marker variant="${s(p.variant)}">\n  <MarkerContent>${esc(p.text)}</MarkerContent>\n</Marker>`,
  },

  {
    type: "threads",
    label: "Thread history",
    category: "AI",
    terms: "chat history conversations sidebar recent",
    defaults: () => ({
      props: {
        today: "Fix flaky checkout test, Add CSV export to reports",
        earlier: "Migrate auth to OAuth, Weekly revenue summary, Draft launch email, Explain the billing cron",
        active: 1,
        running: 2,
      },
    }),
    fields: [
      { key: "today", label: "Today (comma separated)", kind: "text" },
      { key: "earlier", label: "Earlier (comma separated)", kind: "text" },
      { key: "active", label: "Active item (1 = first)", kind: "number" },
      { key: "running", label: "Running item (0 = none)", kind: "number" },
    ],
    render: (p) => {
      let i = 0
      const group = (title: string, items: string[]) =>
        items.length > 0 && (
          <div className="grid gap-0.5">
            <div className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{title}</div>
            {items.map((t) => {
              i++
              const active = i === Number(p.active)
              const running = i === Number(p.running)
              return (
                <div key={t + i} className={`flex h-8 items-center gap-2 rounded-md px-2 text-sm ${active ? "bg-accent font-medium text-accent-foreground" : "text-foreground/80"}`}>
                  <span className="min-w-0 flex-1 truncate">{t}</span>
                  {running && <Spinner className="size-3.5 text-muted-foreground" />}
                </div>
              )
            })}
          </div>
        )
      return (
        <nav className="grid w-full gap-2">
          {group("Today", list(p.today))}
          {group("Earlier", list(p.earlier))}
        </nav>
      )
    },
    uses: ["spinner"],
    code: (p) =>
      `{/* Grouped by date; the active thread is highlighted, running ones show a spinner. e.g. ${list(p.today).concat(list(p.earlier)).slice(0, 3).map(esc).join(", ")} */}\n<nav className="grid gap-2">\n  {groups.map((group) => (\n    <div key={group.label} className="grid gap-0.5">\n      <div className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">{group.label}</div>\n      {group.threads.map((thread) => (\n        <a key={thread.id} href={\`/c/\${thread.id}\`} data-active={thread.id === activeId} className="flex h-8 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent data-[active=true]:bg-accent data-[active=true]:font-medium">\n          <span className="truncate">{thread.title}</span>\n          {thread.running && <Spinner className="ml-auto size-3.5" />}\n        </a>\n      ))}\n    </div>\n  ))}\n</nav>`,
  },
  {
    type: "tasks",
    label: "Task list",
    category: "AI",
    terms: "agent tasks queue jobs runs status background",
    defaults: () => ({
      props: {
        items: "Fix flaky checkout test, Add CSV export to reports, Upgrade to React 20, Remove dead feature flags",
        statuses: "running, review, done, failed",
        repo: "acme/web",
      },
    }),
    fields: [
      { key: "items", label: "Tasks (comma separated)", kind: "text" },
      { key: "statuses", label: "Statuses: running, review, done, failed", kind: "text" },
      { key: "repo", label: "Repository", kind: "text" },
    ],
    render: (p) => {
      const st = list(p.statuses)
      const icon = (x: string) =>
        x === "running" ? <Spinner className="size-4" /> : x === "review" ? <CircleDot className="size-4 text-amber-500" /> : x === "done" ? <Check className="size-4 text-emerald-600" /> : <X className="size-4 text-destructive" />
      const label: Record<string, string> = { running: "Working · 2m", review: "Ready for review", done: "Merged", failed: "Failed · tests" }
      return (
        <div className="grid w-full gap-1">
          {list(p.items).map((t, i) => {
            const x = st[i] ?? "done"
            return (
              <div key={t} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${i === 0 ? "bg-accent" : ""}`}>
                <span className="mt-0.5 shrink-0 text-muted-foreground">{icon(x)}</span>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate text-sm font-medium">{t}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {s(p.repo)} · {label[x] ?? x}
                  </span>
                </div>
                {(x === "review" || x === "done") && (
                  <span className="shrink-0 font-mono text-xs">
                    <span className="text-emerald-600">+{12 + i * 7}</span> <span className="text-destructive">−{3 + i}</span>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )
    },
    uses: ["spinner"],
    code: (p) =>
      `{/* One row per agent task; status: running (spinner), review, done, failed. Repo: ${esc(p.repo)} */}\n<div className="grid gap-1">\n  {tasks.map((task) => (\n    <a key={task.id} href={\`/tasks/\${task.id}\`} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-accent">\n      <TaskStatusIcon status={task.status} />\n      <div className="grid min-w-0 flex-1 gap-0.5">\n        <span className="truncate text-sm font-medium">{task.title}</span>\n        <span className="truncate text-xs text-muted-foreground">{task.repo} · {task.statusLabel}</span>\n      </div>\n      {task.diff && <span className="font-mono text-xs">+{task.diff.added} −{task.diff.removed}</span>}\n    </a>\n  ))}\n</div>`,
  },
  {
    type: "diff",
    label: "Diff",
    category: "AI",
    terms: "changes code review patch file git",
    defaults: () => ({
      props: {
        file: "tests/checkout.spec.ts",
        code: "  await page.click('Pay')\n- await page.waitForTimeout(2000)\n+ await page.waitForResponse(\n+   (r) => r.url().includes('/pay'),\n+ )\n  await expect(page.getByText('Paid')).toBeVisible()",
      },
    }),
    fields: [
      { key: "file", label: "File", kind: "text" },
      { key: "code", label: "Lines (+ added, - removed)", kind: "textarea" },
    ],
    render: (p) => {
      const lines = s(p.code).split("\n")
      const added = lines.filter((l) => l.startsWith("+")).length
      const removed = lines.filter((l) => l.startsWith("-")).length
      return (
        <CodeBlock size="sm">
          <CodeBlockHeader>
            <CodeBlockTitle className="font-mono">{s(p.file)}</CodeBlockTitle>
            <CodeBlockActions className="font-mono text-xs">
              <span className="text-emerald-600">+{added}</span> <span className="text-destructive">−{removed}</span>
            </CodeBlockActions>
          </CodeBlockHeader>
          <CodeBlockContent>
            {lines.map((l, i) => (
              <CodeBlockLine key={i} variant={l.startsWith("+") ? "added" : l.startsWith("-") ? "removed" : "default"}>
                {l.replace(/^[+-] ?|^  /, "")}
              </CodeBlockLine>
            ))}
          </CodeBlockContent>
        </CodeBlock>
      )
    },
    uses: ["code-block"],
    code: (p) =>
      `{/* Diff of ${esc(p.file)}: one CodeBlockLine per line, variant "added" / "removed" */}\n<CodeBlock size="sm">\n  <CodeBlockHeader>\n    <CodeBlockTitle>{file.path}</CodeBlockTitle>\n    <CodeBlockActions>+{file.added} −{file.removed}</CodeBlockActions>\n  </CodeBlockHeader>\n  <CodeBlockContent>\n    {file.lines.map((line, i) => (\n      <CodeBlockLine key={i} variant={line.type}>{line.text}</CodeBlockLine>\n    ))}\n  </CodeBlockContent>\n</CodeBlock>`,
  },
  {
    type: "approval",
    label: "Approval",
    category: "AI",
    terms: "human in the loop permission confirm tool allow deny",
    defaults: () => ({
      props: {
        title: "Run a database migration?",
        description: "The agent wants to run a command that changes the staging database.",
        command: "pnpm db:migrate --env staging",
      },
    }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Why it's asking", kind: "textarea" },
      { key: "command", label: "Command or tool input", kind: "text" },
    ],
    render: (p) => (
      <div className="grid w-full gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ShieldCheck className="size-4" />
          </span>
          <div className="grid gap-0.5">
            <div className="text-sm font-medium">{s(p.title)}</div>
            <div className="text-sm text-muted-foreground">{s(p.description)}</div>
          </div>
        </div>
        {p.command && (
          <CodeBlock size="sm">
            <CodeBlockContent>{`$ ${s(p.command)}`}</CodeBlockContent>
          </CodeBlock>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm">
            Always allow
          </Button>
          <Button variant="outline" size="sm">
            Deny
          </Button>
          <Button size="sm">Approve</Button>
        </div>
      </div>
    ),
    uses: ["code-block", "button"],
    code: (p) =>
      `{/* The run pauses here until the user decides; send the decision back as the tool result */}\n<div className="grid gap-3 rounded-xl border bg-card p-4">\n  <div className="flex items-start gap-3">\n    <ShieldCheckIcon className="size-4" />\n    <div>\n      <p className="text-sm font-medium">${esc(p.title)}</p>\n      <p className="text-sm text-muted-foreground">${esc(p.description)}</p>\n    </div>\n  </div>\n  <CodeBlock size="sm">\n    <CodeBlockContent>$ ${esc(p.command)}</CodeBlockContent>\n  </CodeBlock>\n  <div className="flex justify-end gap-2">\n    <Button variant="ghost" size="sm" onClick={() => decide("always")}>Always allow</Button>\n    <Button variant="outline" size="sm" onClick={() => decide("deny")}>Deny</Button>\n    <Button size="sm" onClick={() => decide("approve")}>Approve</Button>\n  </div>\n</div>`,
  },
  {
    type: "starters",
    label: "Prompt starters",
    category: "AI",
    terms: "empty chat welcome examples cards suggestions",
    defaults: () => ({
      props: {
        items: "Analyze data — Upload a CSV and get charts, Write code — Build a feature from a spec, Summarize — Turn a long doc into key points, Plan — Break a project into tasks",
      },
    }),
    fields: [{ key: "items", label: "Starters: Title — description, …", kind: "textarea" }],
    render: (p) => (
      <div className="grid w-full grid-cols-2 gap-3">
        {list(p.items).map((x) => {
          const [title, desc] = x.split("—").map((y) => y.trim())
          return (
            <div key={x} className="grid gap-1 rounded-xl border bg-card p-4 text-left">
              <Sparkles className="mb-1 size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{title}</span>
              {desc && <span className="text-sm text-muted-foreground">{desc}</span>}
            </div>
          )
        })}
      </div>
    ),
    uses: [],
    code: (p) =>
      `<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">\n${list(p.items)
        .map((x) => {
          const [title, desc] = x.split("—").map((y) => y.trim())
          return `  <button onClick={() => send("${esc(title)}")} className="grid gap-1 rounded-xl border bg-card p-4 text-left hover:bg-accent">\n    <span className="text-sm font-medium">${esc(title)}</span>\n    <span className="text-sm text-muted-foreground">${esc(desc ?? "")}</span>\n  </button>`
        })
        .join("\n")}\n</div>`,
  },
]
