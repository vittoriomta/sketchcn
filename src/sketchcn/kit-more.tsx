// More shadcn parts: actions, form controls, navigation, overlays and feedback.
// Overlays render in their open state, in place, so a screen can show "the dialog is open".

import { ChevronDown, Ellipsis, Search } from "lucide-react"
import type { Part } from "./kit-base"
import { esc, indent, list, s } from "./kit-base"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const field = (label: unknown, control: string) =>
  label ? `<div className="grid gap-2">\n  <Label>${esc(label)}</Label>\n${indent(control, 1)}\n</div>` : control

// Static copies of the overlay surfaces, so they sit in the layout instead of a portal.
const surface = "rounded-lg border bg-popover text-popover-foreground shadow-md"

export const MORE_PARTS: Part[] = [
  // ── Layout ────────────────────────────────────────────────────────────
  {
    type: "accordion",
    label: "Accordion",
    category: "Layout",
    terms: "faq collapse expand",
    defaults: () => ({
      props: {
        items: "Is it accessible?, Is it styled?, Is it animated?",
        answer: "Yes. It adheres to the WAI-ARIA design pattern.",
      },
    }),
    fields: [
      { key: "items", label: "Questions (comma separated)", kind: "text" },
      { key: "answer", label: "First answer", kind: "textarea" },
    ],
    render: (p) => {
      const items = list(p.items)
      return (
        <Accordion type="single" collapsible defaultValue="0" className="w-full">
          {items.map((t, i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger>{t}</AccordionTrigger>
              <AccordionContent className="animate-none!">{i === 0 ? s(p.answer) : "…"}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )
    },
    uses: ["accordion"],
    code: (p) => {
      const items = list(p.items)
        .map(
          (t, i) =>
            `  <AccordionItem value="item-${i + 1}">\n    <AccordionTrigger>${esc(t)}</AccordionTrigger>\n    <AccordionContent>${i === 0 ? esc(p.answer) : "…"}</AccordionContent>\n  </AccordionItem>`,
        )
        .join("\n")
      return `<Accordion type="single" collapsible defaultValue="item-1">\n${items}\n</Accordion>`
    },
  },

  // ── Content ───────────────────────────────────────────────────────────
  {
    type: "kbd",
    label: "Kbd",
    category: "Content",
    terms: "keyboard shortcut key",
    defaults: () => ({ props: { keys: "⌘, K" } }),
    fields: [{ key: "keys", label: "Keys (comma separated)", kind: "text" }],
    render: (p) => (
      <KbdGroup>
        {list(p.keys).map((k, ki) => (
          <Kbd key={ki}>{k}</Kbd>
        ))}
      </KbdGroup>
    ),
    uses: ["kbd"],
    code: (p) => `<KbdGroup>\n${list(p.keys).map((k) => `  <Kbd>${esc(k)}</Kbd>`).join("\n")}\n</KbdGroup>`,
  },

  // ── Actions ───────────────────────────────────────────────────────────
  {
    type: "button-group",
    label: "Button group",
    category: "Actions",
    terms: "segmented split",
    defaults: () => ({ props: { labels: "Archive, Report, Snooze" } }),
    fields: [{ key: "labels", label: "Buttons (comma separated)", kind: "text" }],
    render: (p) => (
      <ButtonGroup>
        {list(p.labels).map((l, ki) => (
          <Button key={ki} variant="outline">
            {l}
          </Button>
        ))}
      </ButtonGroup>
    ),
    uses: ["button-group", "button"],
    code: (p) => `<ButtonGroup>\n${list(p.labels).map((l) => `  <Button variant="outline">${esc(l)}</Button>`).join("\n")}\n</ButtonGroup>`,
  },
  {
    type: "toggle-group",
    label: "Toggle group",
    category: "Actions",
    terms: "segmented filter switcher",
    defaults: () => ({ props: { options: "Day, Week, Month", variant: "outline" } }),
    fields: [
      { key: "options", label: "Options (comma separated, first is on)", kind: "text" },
      { key: "variant", label: "Variant", kind: "select", options: ["default", "outline"] },
    ],
    render: (p) => {
      const opts = list(p.options)
      return (
        <ToggleGroup type="single" defaultValue={opts[0]} variant={s(p.variant) as "outline"} className="max-w-full flex-wrap">
          {opts.map((o, ki) => (
            <ToggleGroupItem key={ki} value={o} className="px-2.5">
              {o}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )
    },
    uses: ["toggle-group"],
    code: (p) => {
      const opts = list(p.options)
      return `<ToggleGroup type="single" defaultValue="${esc(opts[0]).toLowerCase()}" variant="${s(p.variant)}">\n${opts
        .map((o) => `  <ToggleGroupItem value="${esc(o).toLowerCase()}">${esc(o)}</ToggleGroupItem>`)
        .join("\n")}\n</ToggleGroup>`
    },
  },

  // ── Forms ─────────────────────────────────────────────────────────────
  {
    type: "input-group",
    label: "Search field",
    category: "Forms",
    terms: "input group addon icon search",
    defaults: () => ({ props: { placeholder: "Search…", shortcut: "⌘K" } }),
    fields: [
      { key: "placeholder", label: "Placeholder", kind: "text" },
      { key: "shortcut", label: "Shortcut hint", kind: "text" },
    ],
    render: (p) => (
      <InputGroup>
        <InputGroupInput placeholder={s(p.placeholder)} tabIndex={-1} />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        {p.shortcut && (
          <InputGroupAddon align="inline-end">
            <Kbd>{s(p.shortcut)}</Kbd>
          </InputGroupAddon>
        )}
      </InputGroup>
    ),
    uses: ["input-group", "kbd"],
    code: (p) =>
      `<InputGroup>\n  <InputGroupInput placeholder="${esc(p.placeholder)}" />\n  <InputGroupAddon>\n    <SearchIcon />\n  </InputGroupAddon>\n${
        p.shortcut ? `  <InputGroupAddon align="inline-end">\n    <Kbd>${esc(p.shortcut)}</Kbd>\n  </InputGroupAddon>\n` : ""
      }</InputGroup>`,
  },
  {
    type: "radio-group",
    label: "Radio group",
    category: "Forms",
    terms: "choice option",
    defaults: () => ({ props: { label: "Notify me about", options: "All new messages, Direct messages and mentions, Nothing" } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "options", label: "Options (comma separated)", kind: "text" },
    ],
    render: (p) => {
      const opts = list(p.options)
      return (
        <div className="grid gap-3">
          {p.label && <Label>{s(p.label)}</Label>}
          <RadioGroup defaultValue={opts[0]}>
            {opts.map((o, ki) => (
              <div key={ki} className="flex items-center gap-2">
                <RadioGroupItem value={o} tabIndex={-1} />
                <Label className="font-normal">{o}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )
    },
    uses: ["radio-group", "label"],
    code: (p) => {
      const opts = list(p.options)
      const items = opts
        .map((o, i) => `  <div className="flex items-center gap-2">\n    <RadioGroupItem value="${esc(o).toLowerCase()}" id="r${i + 1}" />\n    <Label htmlFor="r${i + 1}">${esc(o)}</Label>\n  </div>`)
        .join("\n")
      return field(p.label, `<RadioGroup defaultValue="${esc(opts[0]).toLowerCase()}">\n${items}\n</RadioGroup>`)
    },
  },
  {
    type: "slider",
    label: "Slider",
    category: "Forms",
    terms: "range volume",
    defaults: () => ({ props: { label: "Volume", value: 60 } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "value", label: "Value (0–100)", kind: "number" },
    ],
    render: (p) => (
      <div className="grid w-full gap-3">
        {p.label && (
          <div className="flex justify-between text-sm">
            <Label>{s(p.label)}</Label>
            <span className="text-muted-foreground tabular-nums">{Number(p.value)}</span>
          </div>
        )}
        <Slider defaultValue={[Number(p.value)]} max={100} step={1} tabIndex={-1} />
      </div>
    ),
    uses: ["slider", "label"],
    code: (p) => field(p.label, `<Slider defaultValue={[${Number(p.value)}]} max={100} step={1} />`),
  },
  {
    type: "input-otp",
    label: "One-time code",
    category: "Forms",
    terms: "otp pin verification 2fa",
    defaults: () => ({ props: { label: "Verification code", length: 6 } }),
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "length", label: "Digits", kind: "select", options: ["4", "6"] },
    ],
    render: (p) => {
      const n = Number(p.length) === 4 ? 4 : 6
      const half = n / 2
      return (
        <div className="grid gap-2">
          {p.label && <Label>{s(p.label)}</Label>}
          <InputOTP maxLength={n} tabIndex={-1}>
            <InputOTPGroup>
              {Array.from({ length: half }, (_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              {Array.from({ length: half }, (_, i) => (
                <InputOTPSlot key={i} index={half + i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      )
    },
    uses: ["input-otp", "label"],
    code: (p) => {
      const n = Number(p.length) === 4 ? 4 : 6
      const half = n / 2
      const slots = (from: number) => Array.from({ length: half }, (_, i) => `    <InputOTPSlot index={${from + i}} />`).join("\n")
      return field(p.label, `<InputOTP maxLength={${n}}>\n  <InputOTPGroup>\n${slots(0)}\n  </InputOTPGroup>\n  <InputOTPSeparator />\n  <InputOTPGroup>\n${slots(half)}\n  </InputOTPGroup>\n</InputOTP>`)
    },
  },

  // ── Data ──────────────────────────────────────────────────────────────
  {
    type: "list",
    label: "List",
    category: "Data",
    terms: "item rows settings",
    defaults: () => ({
      props: {
        items: "Two-factor authentication, Login alerts, Active sessions",
        description: "Manage how you sign in",
        action: "Manage",
        variant: "outline",
      },
    }),
    fields: [
      { key: "items", label: "Items (comma separated)", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
      { key: "action", label: "Action label", kind: "text" },
      { key: "variant", label: "Variant", kind: "select", options: ["default", "outline", "muted", "plain"] },
    ],
    render: (p) => (
      <ItemGroup className={p.variant === "plain" ? "gap-0" : undefined}>
        {list(p.items).map((t, ki) => (
          <Item
            key={ki}
            variant={(p.variant === "plain" ? "default" : s(p.variant)) as "outline"}
            size={p.variant === "plain" ? "sm" : undefined}
            className={p.variant === "plain" ? "px-2 py-1.5 [&_[data-slot=item-title]]:font-normal" : undefined}
          >
            <ItemContent>
              <ItemTitle>{t}</ItemTitle>
              {p.description && <ItemDescription>{s(p.description)}</ItemDescription>}
            </ItemContent>
            {p.action && (
              <ItemActions>
                <Button variant="outline" size="sm">
                  {s(p.action)}
                </Button>
              </ItemActions>
            )}
          </Item>
        ))}
      </ItemGroup>
    ),
    uses: ["item", "button"],
    code: (p) => {
      const items = list(p.items)
        .map(
          (t) =>
            `  <Item ${p.variant === "plain" ? `size="sm"` : `variant="${s(p.variant)}"`}>\n    <ItemContent>\n      <ItemTitle>${esc(t)}</ItemTitle>\n${
              p.description ? `      <ItemDescription>${esc(p.description)}</ItemDescription>\n` : ""
            }    </ItemContent>\n${p.action ? `    <ItemActions>\n      <Button variant="outline" size="sm">${esc(p.action)}</Button>\n    </ItemActions>\n` : ""}  </Item>`,
        )
        .join("\n")
      return `<ItemGroup>\n${items}\n</ItemGroup>`
    },
  },
  {
    type: "calendar",
    label: "Calendar",
    category: "Data",
    terms: "date picker month",
    defaults: () => ({ props: {} }),
    fields: [],
    render: () => <Calendar mode="single" selected={new Date(2026, 10, 17)} defaultMonth={new Date(2026, 10, 1)} className="w-fit rounded-lg border" />,
    uses: ["calendar"],
    code: () => `<Calendar mode="single" selected={date} onSelect={setDate} className="rounded-lg border" />`,
  },

  // ── Navigation ────────────────────────────────────────────────────────
  {
    type: "breadcrumb",
    label: "Breadcrumb",
    category: "Navigation",
    terms: "path trail",
    defaults: () => ({ props: { path: "Home, Customers, Olivia Martin" } }),
    fields: [
      { key: "path", label: "Path (comma separated)", kind: "text" },
      { key: "style", label: "Style", kind: "select", options: ["default", "title"] },
    ],
    render: (p) => {
      const parts = list(p.path)
      if (p.style === "title")
        return (
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[13px]">
            {parts.map((x, i) =>
              i === parts.length - 1 ? (
                <span key={i} className="truncate font-semibold tracking-[-0.01em]">
                  {x}
                </span>
              ) : (
                <span key={i} className="contents">
                  <span className="text-muted-foreground">{x}</span>
                  <span className="text-muted-foreground/50">/</span>
                </span>
              ),
            )}
          </nav>
        )
      return (
        <Breadcrumb>
          <BreadcrumbList>
            {parts.map((x, i) => (
              <span key={i} className="contents">
                <BreadcrumbItem>{i === parts.length - 1 ? <BreadcrumbPage>{x}</BreadcrumbPage> : <BreadcrumbLink href="#">{x}</BreadcrumbLink>}</BreadcrumbItem>
                {i < parts.length - 1 && <BreadcrumbSeparator />}
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )
    },
    uses: ["breadcrumb"],
    code: (p) => {
      const parts = list(p.path)
      if (p.style === "title")
        return `<nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[13px]">\n${parts
          .map((x, i) =>
            i === parts.length - 1
              ? `  <h1 className="truncate font-semibold tracking-[-0.01em]">${esc(x)}</h1>`
              : `  <a href="…" className="hidden text-muted-foreground hover:text-foreground sm:inline">${esc(x)}</a>\n  <span className="hidden text-muted-foreground/50 sm:inline">/</span>`,
          )
          .join("\n")}\n</nav>`
      const items = parts
        .map((x, i) =>
          i === parts.length - 1
            ? `    <BreadcrumbItem>\n      <BreadcrumbPage>${esc(x)}</BreadcrumbPage>\n    </BreadcrumbItem>`
            : `    <BreadcrumbItem>\n      <BreadcrumbLink href="…">${esc(x)}</BreadcrumbLink>\n    </BreadcrumbItem>\n    <BreadcrumbSeparator />`,
        )
        .join("\n")
      return `<Breadcrumb>\n  <BreadcrumbList>\n${items}\n  </BreadcrumbList>\n</Breadcrumb>`
    },
  },
  {
    type: "pagination",
    label: "Pagination",
    category: "Navigation",
    terms: "pages next previous",
    defaults: () => ({ props: { pages: 10, current: 2 } }),
    fields: [
      { key: "pages", label: "Pages", kind: "number" },
      { key: "current", label: "Current page", kind: "number" },
    ],
    render: (p) => {
      const cur = Math.max(1, Number(p.current) || 1)
      return (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            {[cur - 1, cur, cur + 1].filter((n) => n >= 1).map((n, ki) => (
              <PaginationItem key={ki}>
                <PaginationLink href="#" isActive={n === cur}>
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )
    },
    uses: ["pagination"],
    code: (p) =>
      `{/* ${Number(p.pages)} pages, page ${Number(p.current)} active */}\n<Pagination>\n  <PaginationContent>\n    <PaginationItem>\n      <PaginationPrevious href="…" />\n    </PaginationItem>\n    {pages.map((page, ki) => (\n      <PaginationItem key={ki}>\n        <PaginationLink href="…" isActive={page === current}>{page}</PaginationLink>\n      </PaginationItem>\n    ))}\n    <PaginationItem>\n      <PaginationNext href="…" />\n    </PaginationItem>\n  </PaginationContent>\n</Pagination>`,
  },
  {
    type: "command",
    label: "Command menu",
    category: "Navigation",
    terms: "cmdk palette search spotlight",
    defaults: () => ({ props: { placeholder: "Type a command or search…", items: "Calendar, Search emoji, Calculator, Settings" } }),
    fields: [
      { key: "placeholder", label: "Placeholder", kind: "text" },
      { key: "items", label: "Items (comma separated)", kind: "text" },
    ],
    render: (p) => (
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder={s(p.placeholder)} tabIndex={-1} />
        <CommandList>
          <CommandGroup heading="Suggestions">
            {list(p.items).map((x, i) => (
              <CommandItem key={x}>
                {x}
                {i === 0 && <CommandShortcut>⌘K</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    ),
    uses: ["command"],
    code: (p) =>
      `<Command className="rounded-lg border shadow-md">\n  <CommandInput placeholder="${esc(p.placeholder)}" />\n  <CommandList>\n    <CommandEmpty>No results found.</CommandEmpty>\n    <CommandGroup heading="Suggestions">\n${list(p.items)
        .map((x) => `      <CommandItem>${esc(x)}</CommandItem>`)
        .join("\n")}\n    </CommandGroup>\n  </CommandList>\n</Command>`,
  },

  // ── Overlays (shown open, in place) ───────────────────────────────────
  {
    type: "dialog",
    label: "Dialog",
    category: "Overlays",
    terms: "modal popup",
    container: { flow: "column", slotClass: () => "flex flex-col gap-4" },
    defaults: () => ({ props: { title: "Edit profile", description: "Make changes to your profile here.", confirm: "Save changes", cancel: "Cancel", size: "md" }, children: [] }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "size", label: "Width", kind: "select", options: ["md", "lg", "xl"] },
      { key: "description", label: "Description", kind: "text" },
      { key: "confirm", label: "Confirm label", kind: "text" },
      { key: "cancel", label: "Cancel label", kind: "text" },
    ],
    render: (p, slot) => (
      <div className="relative flex min-h-80 w-full items-center justify-center overflow-hidden rounded-lg bg-black/40 p-6">
        <div className={`grid w-full gap-4 rounded-xl border bg-background p-6 shadow-lg ${({ lg: "max-w-2xl", xl: "max-w-4xl" } as Record<string, string>)[s(p.size)] ?? "max-w-md"}`}>
          <div className="grid gap-1.5">
            <div className="text-lg leading-none font-semibold">{s(p.title)}</div>
            {p.description && <p className="text-sm text-muted-foreground">{s(p.description)}</p>}
          </div>
          {slot}
          <div className="flex justify-end gap-2">
            {p.cancel && <Button variant="outline">{s(p.cancel)}</Button>}
            {p.confirm && <Button>{s(p.confirm)}</Button>}
          </div>
        </div>
      </div>
    ),
    uses: ["dialog", "button"],
    code: (p, kids) =>
      `{/* Shown open in the sketch: wire it to the trigger that links here */}\n<Dialog>\n  <DialogContent className="${({ lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" } as Record<string, string>)[s(p.size)] ?? "sm:max-w-md"}">\n    <DialogHeader>\n      <DialogTitle>${esc(p.title)}</DialogTitle>\n${
        p.description ? `      <DialogDescription>${esc(p.description)}</DialogDescription>\n` : ""
      }    </DialogHeader>\n${kids ? `    <div className="grid gap-4">\n${indent(kids, 2)}\n    </div>\n` : ""}    <DialogFooter>\n${
        p.cancel ? `      <DialogClose asChild>\n        <Button variant="outline">${esc(p.cancel)}</Button>\n      </DialogClose>\n` : ""
      }${p.confirm ? `      <Button>${esc(p.confirm)}</Button>\n` : ""}    </DialogFooter>\n  </DialogContent>\n</Dialog>`,
  },
  {
    type: "sheet",
    label: "Sheet",
    category: "Overlays",
    terms: "drawer side panel",
    container: { flow: "column", slotClass: () => "flex flex-col gap-4" },
    defaults: () => ({ props: { title: "Filters", description: "Narrow down the results.", side: "right" }, children: [] }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
      { key: "side", label: "Side", kind: "select", options: ["right", "left", "bottom"] },
    ],
    render: (p, slot) => {
      const side = s(p.side)
      const panel = (
        <div className={`grid content-start gap-4 bg-background p-6 shadow-lg ${side === "bottom" ? "w-full border-t" : `w-80 ${side === "left" ? "border-r" : "border-l"}`}`}>
          <div className="grid gap-1.5">
            <div className="text-base font-semibold">{s(p.title)}</div>
            {p.description && <p className="text-sm text-muted-foreground">{s(p.description)}</p>}
          </div>
          {slot}
        </div>
      )
      return (
        <div className={`relative flex min-h-96 w-full overflow-hidden rounded-lg bg-black/40 ${side === "bottom" ? "items-end" : side === "left" ? "justify-start" : "justify-end"}`}>
          {panel}
        </div>
      )
    },
    uses: ["sheet"],
    code: (p, kids) =>
      `{/* Shown open in the sketch */}\n<Sheet>\n  <SheetContent side="${s(p.side)}">\n    <SheetHeader>\n      <SheetTitle>${esc(p.title)}</SheetTitle>\n${
        p.description ? `      <SheetDescription>${esc(p.description)}</SheetDescription>\n` : ""
      }    </SheetHeader>\n${kids ? `    <div className="grid gap-4 px-4">\n${indent(kids, 2)}\n    </div>\n` : ""}  </SheetContent>\n</Sheet>`,
  },
  {
    type: "alert-dialog",
    label: "Confirm dialog",
    category: "Overlays",
    terms: "alert dialog destructive delete are you sure",
    defaults: () => ({ props: { title: "Delete this project?", description: "This permanently deletes the project and its data.", action: "Delete", destructive: true } }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "action", label: "Action label", kind: "text" },
      { key: "destructive", label: "Destructive", kind: "boolean" },
    ],
    render: (p) => (
      <div className="flex min-h-64 w-full items-center justify-center rounded-lg bg-black/40 p-6">
        <div className="grid w-full max-w-sm gap-4 rounded-xl border bg-background p-6 shadow-lg">
          <div className="grid gap-1.5">
            <div className="text-base font-semibold">{s(p.title)}</div>
            <p className="text-sm text-muted-foreground">{s(p.description)}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button variant={p.destructive ? "destructive" : "default"}>{s(p.action)}</Button>
          </div>
        </div>
      </div>
    ),
    uses: ["alert-dialog"],
    code: (p) =>
      `<AlertDialog>\n  <AlertDialogContent>\n    <AlertDialogHeader>\n      <AlertDialogTitle>${esc(p.title)}</AlertDialogTitle>\n      <AlertDialogDescription>${esc(p.description)}</AlertDialogDescription>\n    </AlertDialogHeader>\n    <AlertDialogFooter>\n      <AlertDialogCancel>Cancel</AlertDialogCancel>\n      <AlertDialogAction${p.destructive ? ` variant="destructive"` : ""}>${esc(p.action)}</AlertDialogAction>\n    </AlertDialogFooter>\n  </AlertDialogContent>\n</AlertDialog>`,
  },
  {
    type: "dropdown",
    label: "Dropdown menu",
    category: "Overlays",
    terms: "menu context actions more",
    defaults: () => ({ props: { trigger: "Options", items: "Profile, Billing, Settings, Log out", open: false } }),
    fields: [
      { key: "trigger", label: "Trigger label", kind: "text" },
      { key: "variant", label: "Style", kind: "select", options: ["outline", "ghost"] },
      { key: "items", label: "Items (comma separated)", kind: "text" },
      { key: "open", label: "Draw it open", kind: "boolean" },
    ],
    render: (p) => {
      const items = list(p.items)
      return (
        <div className="inline-grid justify-items-start gap-1">
          {/^(···|…|\.\.\.)$/.test(s(p.trigger).trim()) ? (
            <Button variant="ghost" size="icon-sm" aria-label="More">
              <Ellipsis />
            </Button>
          ) : (
            <Button variant={p.variant === "ghost" ? "ghost" : "outline"} size={p.variant === "ghost" ? "sm" : "default"}>
              {s(p.trigger).replace(/\s*▾$/, "")}
              <ChevronDown className="opacity-60" />
            </Button>
          )}
          {p.open && <div className={`${surface} min-w-44 p-1`}>
            {items.map((x, i) => (
              <div key={i}>
                {i === items.length - 1 && items.length > 2 && <div className="-mx-1 my-1 h-px bg-border" />}
                <div className={`rounded-md px-2 py-1.5 text-sm ${i === 0 ? "bg-accent text-accent-foreground" : ""}`}>{x}</div>
              </div>
            ))}
          </div>}
        </div>
      )
    },
    uses: ["dropdown-menu", "button"],
    code: (p) =>
      `<DropdownMenu>\n  <DropdownMenuTrigger asChild>\n    ${/^(···|…|\.\.\.)$/.test(s(p.trigger).trim()) ? `<Button variant="ghost" size="icon-sm" aria-label="More"><MoreHorizontal /></Button>` : `<Button variant="${p.variant === "ghost" ? "ghost" : "outline"}">${esc(p.trigger)}</Button>`}\n  </DropdownMenuTrigger>\n  <DropdownMenuContent align="start">\n${list(p.items)
        .map((x) => `    <DropdownMenuItem>${esc(x)}</DropdownMenuItem>`)
        .join("\n")}\n  </DropdownMenuContent>\n</DropdownMenu>`,
  },
  {
    type: "tooltip",
    label: "Tooltip",
    category: "Overlays",
    terms: "hint hover",
    defaults: () => ({ props: { trigger: "Hover", tip: "Add to library" } }),
    fields: [
      { key: "trigger", label: "Trigger label", kind: "text" },
      { key: "tip", label: "Tooltip", kind: "text" },
    ],
    render: (p) => (
      <div className="inline-grid justify-items-center gap-1.5 pt-1">
        <div className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background">{s(p.tip)}</div>
        <Button variant="outline">{s(p.trigger)}</Button>
      </div>
    ),
    uses: ["tooltip", "button"],
    code: (p) =>
      `<Tooltip>\n  <TooltipTrigger asChild>\n    <Button variant="outline">${esc(p.trigger)}</Button>\n  </TooltipTrigger>\n  <TooltipContent>${esc(p.tip)}</TooltipContent>\n</Tooltip>`,
  },

  // ── Feedback ──────────────────────────────────────────────────────────
  {
    type: "toast",
    label: "Toast",
    category: "Feedback",
    terms: "sonner notification snackbar",
    defaults: () => ({ props: { title: "Event has been created", description: "Sunday, December 03 at 9:00 AM", action: "Undo" } }),
    fields: [
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
      { key: "action", label: "Action", kind: "text" },
    ],
    render: (p) => (
      <div className={`${surface} flex w-full max-w-sm items-center gap-3 p-4`}>
        <div className="grid flex-1 gap-0.5">
          <div className="text-sm font-medium">{s(p.title)}</div>
          {p.description && <div className="text-sm text-muted-foreground">{s(p.description)}</div>}
        </div>
        {p.action && <Button size="sm">{s(p.action)}</Button>}
      </div>
    ),
    uses: ["sonner"],
    code: (p) =>
      `// Fire when the action completes (needs <Toaster /> in the layout)\ntoast("${esc(p.title)}", {${p.description ? ` description: "${esc(p.description)}",` : ""}${
        p.action ? ` action: { label: "${esc(p.action)}", onClick: () => {} },` : ""
      } })`,
  },
  {
    type: "skeleton",
    label: "Skeleton",
    category: "Feedback",
    terms: "loading placeholder shimmer",
    defaults: () => ({ props: { lines: 3, avatar: true } }),
    fields: [
      { key: "lines", label: "Lines", kind: "number" },
      { key: "avatar", label: "Avatar", kind: "boolean" },
    ],
    render: (p) => (
      <div className="flex w-full items-start gap-4">
        {p.avatar && <Skeleton className="size-10 shrink-0 rounded-full" />}
        <div className="grid flex-1 gap-2">
          {Array.from({ length: Math.max(1, Math.min(8, Number(p.lines) || 3)) }, (_, i) => i).map((i, _, a) => (
            <Skeleton key={i} className={`h-4 ${i === a.length - 1 ? "w-3/5" : "w-full"}`} />
          ))}
        </div>
      </div>
    ),
    uses: ["skeleton"],
    code: (p) =>
      `<div className="flex items-start gap-4">\n${p.avatar ? `  <Skeleton className="size-10 rounded-full" />\n` : ""}  <div className="grid flex-1 gap-2">\n${Array.from({ length: Math.max(1, Number(p.lines) || 3) }, (_, i) => i)
        .map((i, _, a) => `    <Skeleton className="h-4 ${i === a.length - 1 ? "w-3/5" : "w-full"}" />`)
        .join("\n")}\n  </div>\n</div>`,
  },
  {
    type: "spinner",
    label: "Spinner",
    category: "Feedback",
    terms: "loading busy",
    defaults: () => ({ props: { label: "Loading…" } }),
    fields: [{ key: "label", label: "Label", kind: "text" }],
    render: (p) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        {s(p.label)}
      </div>
    ),
    uses: ["spinner"],
    code: (p) => `<div className="flex items-center gap-2 text-sm text-muted-foreground">\n  <Spinner />\n  ${esc(p.label)}\n</div>`,
  },
]
