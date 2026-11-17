import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  CopyPlus,
  Plus,
  Trash,
  X,
} from "lucide-react"
import { useId } from "react"
import type { ReactNode } from "react"
import { Field, IconButton, Segmented, Select, TextArea, TextInput, Toggle, useConfirm } from "./chrome"
import { SHELL_ID } from "./canvas"
import { ACCENT } from "./chrome"
import type { Align, Device, NavItem, Shell, SketchNode } from "./format"
import { findNode, findParent, mapNode, uid } from "./format"
import type { Field as PartField } from "./kit"
import { KIT } from "./kit"
import type { SketchStore } from "./store"

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-2.5 px-3 pt-2.5 pb-3">
      <div className="flex h-5 items-center justify-between">
        <h3 className="text-[11px] font-semibold text-(--skc-muted)">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function PropInput({ id, field, value, onChange }: { id: string; field: PartField; value: unknown; onChange: (v: string | number | boolean) => void }) {
  switch (field.kind) {
    case "textarea":
      return <TextArea id={id} value={String(value ?? "")} onChange={onChange} />
    case "number":
      return <TextInput id={id} type="number" value={Number(value ?? 0)} onChange={(v) => onChange(Number(v))} />
    case "boolean":
      return (
        <div className="flex h-7 items-center">
          <Toggle id={id} on={!!value} onChange={onChange} />
        </div>
      )
    case "select":
      return <Select id={id} value={String(value ?? "")} onChange={onChange} options={(field.options ?? []).map((o) => ({ value: o, label: o }))} />
    default:
      return <TextInput id={id} value={String(value ?? "")} onChange={onChange} />
  }
}

export function Inspector({ store, onDelete }: { store: SketchStore; onDelete: (id: string) => void }) {
  if (store.selectedId === SHELL_ID && (store.screen.shell === "sidebar" || store.screen.shell === "topbar")) return <ShellInspector store={store} />
  const node = store.selectedId ? findNode(store.screen.root, store.selectedId) : null
  return node ? <NodeInspector store={store} node={node} onDelete={onDelete} /> : <ScreenInspector store={store} />
}

/** A short label for the left column; the full one stays in the tooltip. */
const shortLabel = (label: string) => label.replace(/\s*[(:;].*$/, "")

/** One property row: label on the left, control on the right. Long text fields stack. */
function Row({ label, title, stack, children }: { label: string; title?: string; stack?: boolean; children: (id: string) => ReactNode }) {
  const id = useId()
  const text = (
    <label htmlFor={id} title={title ?? label} className="truncate text-[11px] text-(--skc-muted)">
      {label}
    </label>
  )
  if (stack)
    return (
      <div className="grid min-w-0 gap-1">
        {text}
        {children(id)}
      </div>
    )
  return (
    <div className="grid min-h-7 grid-cols-[68px_minmax(0,1fr)] items-center gap-2">
      {text}
      {children(id)}
    </div>
  )
}

function NodeInspector({ store, node, onDelete }: { store: SketchStore; node: SketchNode; onDelete: (id: string) => void }) {
  const part = KIT[node.type]
  const root = store.screen.root
  const loc = findParent(root, node.id)
  const key = `node:${node.id}`
  const update = (fn: (n: SketchNode) => SketchNode, merge?: string) => store.setRoot((r) => mapNode(r, node.id, fn), merge)
  const parent = loc && loc.parent.id !== root.id ? loc.parent : null
  const flow = loc ? (KIT[loc.parent.type]?.container?.flow ?? "column") : "column"

  return (
    <div>
      <div className="flex h-10 items-center gap-0.5 border-b border-(--skc-border) pr-1.5 pl-3">
        <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span className="truncate text-[12px] font-medium">{part?.label ?? node.type}</span>
          {parent && (
            <button type="button" onClick={() => store.select(parent.id)} className="shrink-0 truncate text-[11px] text-(--skc-muted) hover:text-(--skc-fg)" title="Select parent  Esc">
              in {KIT[parent.type]?.label}
            </button>
          )}
        </div>
        <IconButton label="Duplicate" keys="⌘D" onClick={() => store.duplicate(node.id)} disabled={!loc}>
          <CopyPlus />
        </IconButton>
        <IconButton label="Delete" keys="⌫" onClick={() => onDelete(node.id)} disabled={!loc}>
          <Trash />
        </IconButton>
      </div>

      <div className="grid gap-1.5 px-3 py-3">
        {loc && (
          <Row label="Align">
            {() => <AlignControl flow={flow} value={node.align} onChange={(align) => update((n) => ({ ...n, align }))} />}
          </Row>
        )}
        {part?.fields.map((f) => (
          <Row key={f.key} label={shortLabel(f.label)} title={f.label} stack={f.kind === "textarea"}>
            {(id) => <PropInput id={id} field={f} value={node.props[f.key]} onChange={(v) => update((n) => ({ ...n, props: { ...n.props, [f.key]: v } }), `${key}:${f.key}`)} />}
          </Row>
        ))}
      </div>

      <div className="grid gap-1.5 border-t border-(--skc-border) px-3 py-3">
        <Row label="Link">
          {(id) => (
            <Select
              id={id}
              value={node.link ?? ""}
              onChange={(v) => update((n) => ({ ...n, link: v || undefined }))}
              options={[{ value: "", label: "None" }, ...store.doc.screens.map((s) => ({ value: s.id, label: s.name }))]}
            />
          )}
        </Row>
        <TextArea placeholder="Note for the agent" value={node.note ?? ""} onChange={(v) => update((n) => ({ ...n, note: v || undefined }), `${key}:note`)} />
      </div>
    </div>
  )
}

/** Left / center / right in a column or grid, top / middle / bottom in a row. Click the active one to reset. */
function AlignControl({ flow, value, onChange }: { flow: "column" | "row" | "grid"; value?: Align; onChange: (v: Align | undefined) => void }) {
  const row = flow === "row"
  const options: { value: Align; label: string; icon: ReactNode }[] = row
    ? [
        { value: "start", label: "Top  ⌥W", icon: <AlignStartHorizontal /> },
        { value: "center", label: "Middle  ⌥V", icon: <AlignCenterHorizontal /> },
        { value: "end", label: "Bottom  ⌥S", icon: <AlignEndHorizontal /> },
      ]
    : [
        { value: "start", label: "Left  ⌥A", icon: <AlignStartVertical /> },
        { value: "center", label: "Center  ⌥H", icon: <AlignCenterVertical /> },
        { value: "end", label: "Right  ⌥D", icon: <AlignEndVertical /> },
      ]
  return <Segmented<Align | "auto"> value={value ?? "auto"} options={options} onChange={(v) => onChange(v === value ? undefined : (v as Align))} />
}

/** The four shells as tiny diagrams: easier to scan than words. */
function ShellPicker({ value, onChange }: { value: Shell; onChange: (s: Shell) => void }) {
  const opts: { value: Shell; label: string; draw: ReactNode }[] = [
    { value: "sidebar", label: "Sidebar", draw: <><rect x="1" y="1" width="10" height="26" rx="1.5" fill="currentColor" opacity=".35" /><rect x="14" y="4" width="21" height="3" rx="1" fill="currentColor" opacity=".5" /><rect x="14" y="10" width="21" height="14" rx="1.5" fill="currentColor" opacity=".18" /></> },
    { value: "topbar", label: "Top bar", draw: <><rect x="1" y="1" width="34" height="6" rx="1.5" fill="currentColor" opacity=".35" /><rect x="4" y="10" width="28" height="3" rx="1" fill="currentColor" opacity=".5" /><rect x="4" y="16" width="28" height="9" rx="1.5" fill="currentColor" opacity=".18" /></> },
    { value: "none", label: "Page", draw: <><rect x="4" y="4" width="28" height="3" rx="1" fill="currentColor" opacity=".5" /><rect x="4" y="10" width="28" height="15" rx="1.5" fill="currentColor" opacity=".18" /></> },
    { value: "full", label: "Full", draw: <><rect x="1" y="1" width="10" height="26" rx="1.5" fill="currentColor" opacity=".18" /><rect x="12" y="1" width="12" height="26" rx="1.5" fill="currentColor" opacity=".35" /><rect x="25" y="1" width="10" height="26" rx="1.5" fill="currentColor" opacity=".18" /></> },
  ]
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`grid justify-items-center gap-1 rounded-md p-1.5 pb-1 ${value === o.value ? "bg-(--skc-active) text-(--skc-fg)" : "text-(--skc-muted) hover:bg-(--skc-hover) hover:text-(--skc-fg)"}`}
          style={value === o.value ? { boxShadow: `inset 0 0 0 1px ${ACCENT}` } : undefined}
        >
          <svg viewBox="0 0 36 28" className="h-6 w-9" aria-hidden>
            <rect x=".5" y=".5" width="35" height="27" rx="2.5" fill="none" stroke="currentColor" strokeOpacity=".35" />
            {o.draw}
          </svg>
          <span className="text-[10.5px] leading-none">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

function PanelHeader({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex h-11 items-center gap-0.5 border-b border-(--skc-border) pr-1.5 pl-3">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] leading-tight text-(--skc-muted)">{kicker}</div>
        <div className="truncate text-[12px] leading-tight font-medium">{title}</div>
      </div>
      {children}
    </div>
  )
}

function ScreenInspector({ store }: { store: SketchStore }) {
  const { screen, doc } = store
  const merge = `screen:${screen.id}`
  const confirm = useConfirm()
  const armed = confirm.armed === screen.id
  const hasShell = screen.shell === "sidebar" || screen.shell === "topbar"

  return (
    <div>
      <PanelHeader kicker={screen.path} title={screen.name}>
        {doc.screens.length > 1 && (
          <IconButton
            label={armed ? "Click again to delete" : "Delete screen"}
            danger={armed}
            onClick={() => confirm.ask(screen.id, () => store.removeScreen(screen.id))}
          >
            <Trash />
          </IconButton>
        )}
      </PanelHeader>
      <Section title="Details">
        <Field label="Name">{(id) => <TextInput id={id} value={screen.name} onChange={(v) => store.updateScreen({ name: v }, `${merge}:name`)} />}</Field>
        <Field label="Route">{(id) => <TextInput id={id} mono value={screen.path} onChange={(v) => store.updateScreen({ path: v }, `${merge}:path`)} />}</Field>
        <Field label="Purpose" hint="Tells the agent what the screen is for.">
          {(id) => (
            <TextArea id={id} placeholder="e.g. Overview of revenue and new customers" value={screen.purpose ?? ""} onChange={(v) => store.updateScreen({ purpose: v || undefined }, `${merge}:purpose`)} />
          )}
        </Field>
      </Section>
      <Section title="Layout">
        <ShellPicker value={screen.shell} onChange={(shell) => store.updateScreen({ shell })} />
        <Segmented<Device>
          value={screen.device}
          onChange={(device) => store.updateScreen({ device })}
          options={[
            { value: "desktop", label: "Desktop" },
            { value: "mobile", label: "Mobile" },
          ]}
        />
      </Section>
      {hasShell && (
        <Section title="Navigation">
          <button
            type="button"
            onClick={() => store.select(SHELL_ID)}
            className="flex h-8 items-center justify-between rounded-md bg-(--skc-hover) px-2.5 text-[12px] hover:bg-(--skc-active)"
          >
            <span className="truncate">
              {doc.app.name} · {doc.app.nav.length} items
            </span>
            <span className="flex items-center gap-0.5 text-(--skc-muted)">
              Edit <ChevronRight className="size-3.5" />
            </span>
          </button>
          <div className="text-[11px] text-(--skc-faint)">Or click the {screen.shell === "sidebar" ? "sidebar" : "top bar"} on the canvas.</div>
        </Section>
      )}
    </div>
  )
}

/** The app shell: name, nav items (rename, link, reorder, remove) and its type. Shared by every screen that uses it. */
function ShellInspector({ store }: { store: SketchStore }) {
  const { doc, screen } = store
  const nav = doc.app.nav
  const setApp = (patch: Partial<typeof doc.app>, mergeKey?: string) => store.commit({ ...doc, app: { ...doc.app, ...patch } }, mergeKey)
  const setItem = (id: string, patch: Partial<NavItem>, mergeKey?: string) => setApp({ nav: nav.map((i) => (i.id === id ? { ...i, ...patch } : i)) }, mergeKey)
  const move = (i: number, d: -1 | 1) => {
    const next = [...nav]
    const [it] = next.splice(i, 1)
    next.splice(i + d, 0, it)
    setApp({ nav: next })
  }
  const shared = doc.screens.filter((s) => s.shell === screen.shell).length

  return (
    <div>
      <PanelHeader kicker={`Shared by ${shared} screen${shared === 1 ? "" : "s"}`} title={screen.shell === "sidebar" ? "Sidebar" : "Top bar"} />
      <Section title="App">
        <Field label="Name">{(id) => <TextInput id={id} value={doc.app.name} onChange={(v) => setApp({ name: v }, "app:name")} />}</Field>
      </Section>
      <Section title={`Items · ${nav.length}`}>
        <div className="grid gap-1">
          {nav.map((item, i) => (
            <div key={item.id} className="group relative flex items-center gap-1">
              <div className="min-w-0 flex-1">
                <TextInput value={item.label} onChange={(v) => setItem(item.id, { label: v }, `nav:${item.id}`)} />
              </div>
              <div className="w-[88px] shrink-0">
                <Select
                  value={item.link ?? ""}
                  onChange={(v) => setItem(item.id, { link: v || undefined })}
                  options={[{ value: "", label: "No link" }, ...doc.screens.map((s) => ({ value: s.id, label: `→ ${s.name}` }))]}
                />
              </div>
              {/* Row actions float over the field on hover, so rows stay aligned. */}
              <div className="pointer-events-none absolute top-0.5 right-[92px] flex items-center rounded-[4px] bg-(--skc-field) opacity-0 shadow-[-8px_0_8px_var(--skc-field)] group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
                <IconButton label="Move up" className="size-6" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp />
                </IconButton>
                <IconButton label="Move down" className="size-6" disabled={i === nav.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown />
                </IconButton>
                <IconButton label="Remove" className="size-6" onClick={() => setApp({ nav: nav.filter((x) => x.id !== item.id) })}>
                  <X />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setApp({ nav: [...nav, { id: uid(), label: "New item" }] })}
          className="flex h-7 items-center justify-center gap-1 rounded-md border border-dashed border-(--skc-input) text-[12px] text-(--skc-muted) hover:border-(--skc-muted) hover:text-(--skc-fg) [&_svg]:size-3.5"
        >
          <Plus /> Add item
        </button>
        <div className="text-[11px] text-(--skc-faint)">Double-click an item on the canvas to rename it.</div>
      </Section>
      <Section title="Layout">
        <ShellPicker value={screen.shell} onChange={(shell) => store.updateScreen({ shell })} />
      </Section>
    </div>
  )
}
