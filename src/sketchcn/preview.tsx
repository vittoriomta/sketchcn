// A static, non-interactive render of a screen, for thumbnails.

import type { Flow, Screen, SketchDoc, SketchNode } from "./format"
import { alignClass, fillClass } from "./format"
import { KIT } from "./kit"
import type { Theme } from "./theme"
import { themeStyle } from "./theme"

export function StaticNode({ node, flow }: { node: SketchNode; flow?: Flow }) {
  const part = KIT[node.type]
  if (!part) return null
  const body = part.container
    ? part.render(
        node.props,
        <div className={part.container.slotClass(node.props)}>
          {(node.children ?? []).map((c) => (
            <StaticNode key={c.id} node={c} flow={part.container?.flow} />
          ))}
        </div>,
      )
    : part.render(node.props, null)
  return <div className={`${flow === "row" ? "" : "min-w-0"} ${fillClass(node)} ${alignClass(node.align, flow)}`}>{body}</div>
}

/** The screen at its device width, scaled to `width` px and clipped to `ratio`. */
export function ScreenThumb({ screen, app, theme, width = 240, ratio = 0.625 }: { screen: Screen; app: SketchDoc["app"]; theme?: Theme; width?: number; ratio?: number }) {
  const mobile = screen.device === "mobile"
  const full = mobile ? 390 : 1280
  const scale = width / full
  const content = <StaticNode node={screen.root} />
  return (
    <div className="relative overflow-hidden rounded-lg border border-(--skc-border) bg-white" style={{ width, height: width * ratio }}>
      <div
        className={`skc-frame ${mobile ? "skc-mobile" : ""} pointer-events-none absolute top-0 left-0 bg-background text-foreground ${theme?.mode === "dark" ? "dark" : ""}`}
        style={{ ...themeStyle(theme), width: full, height: (width * ratio) / scale, transform: `scale(${scale})`, transformOrigin: "top left" }}
        aria-hidden
        inert
      >
        {screen.shell === "sidebar" && !mobile ? (
          <div className="flex h-full">
            <aside className="flex w-56 shrink-0 flex-col gap-2 border-r bg-sidebar p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <div className="size-6 rounded-md bg-primary" />
                {app.name}
              </div>
              {app.nav.map((i) => (
                <div key={i.id} className={`rounded-md px-2 py-1.5 text-sm ${i.link === screen.id ? "bg-sidebar-accent" : ""}`}>
                  {i.label}
                </div>
              ))}
            </aside>
            <main className="min-w-0 flex-1 p-8">{content}</main>
          </div>
        ) : screen.shell === "topbar" ? (
          <div>
            <header className="flex h-14 items-center gap-6 border-b px-6 text-sm font-semibold">{app.name}</header>
            <main className="p-8">{content}</main>
          </div>
        ) : screen.shell === "full" ? (
          <main className="h-full">{content}</main>
        ) : (
          <main className={mobile ? "p-4" : "p-8"}>{content}</main>
        )}
      </div>
    </div>
  )
}
