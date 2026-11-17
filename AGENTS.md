# sketchcn

A shadcn registry block: a canvas for sketching screens with the host project's own shadcn components, which produces a prompt for coding agents.

## Layout

- `src/sketchcn/` is the distributed source. Everything here is copied into users' projects by `npx shadcn add`, so it may only import `react`, `lucide-react`, sibling files and `@/components/ui/*`.
  - `format.ts`: Sketch Format types and pure tree helpers. No React.
  - `kit-base.tsx`: part and field types, categories, small string helpers.
  - `kit.tsx`: the original parts plus the registry (`KIT`, `PARTS`, `MODULE_EXPORTS`); `kit-more.tsx`: actions, form controls, navigation, overlays (rendered open, in place), feedback; `kit-ai.tsx`: agentic UI on shadcn's message, bubble, trace, code-block, attachment, questionnaire and marker.
  - `icons.ts`: one icon per part.
  - `templates.ts`: ready-made, linked screen sets built only from kit parts; `gallery.tsx` picks one (add or start from); `preview.tsx` renders static thumbnails.
  - `theme.ts` + `theme-data.ts` (generated from ui.shadcn.com/r/colors; legacy HSL wrapped in hsl()) + `theme-panel.tsx`: base, accent, radius, font, preview mode. Applied as CSS variables on the frame only; the prompt gets a globals.css block.
  - Alignment is a node field (`align`), applied by `alignClass` in the canvas, thumbnails and prompt alike.
  - `regions.ts`: where blocks land. Sidebars and headers take their slot (tagged with a `region` prop), everything else goes to the body column; drops on the layout frame are redirected there.
  - `drag.tsx`: pointer-based drag and drop (no HTML5 DnD): threshold, ghost, hit testing on `data-skc-slot` / `data-skc-node`, gliding insertion line, target outline, auto-scroll, Esc to cancel.
  - `store.ts`: state, undo history with merge keys, localStorage persistence, starter sketch.
  - `canvas.tsx`: frame, app shell, node rendering, drag and drop.
  - `inspector.tsx`: right panel.
  - `chrome.tsx`: sketchcn's own interface: theme tokens (`--skc-*`, light and dark), controls, toasts, second-click confirm. Never uses host ui components.
  - `commands.tsx`: the ⌘K command menu and the shortcuts sheet.
  - `sketch.tsx`: the `<Sketch />` overlay, toolbar, component list and keyboard.
  - `output.ts`: prompt and JSON output.
- `src/components/ui/` holds the stock shadcn components the playground uses.
- `registry.json` lists the files and `registryDependencies` that are shipped. Update it when you add a file or a part that needs a new ui component.

## Adding a part

1. Add an entry to the right list (`kit.tsx`, `kit-more.tsx` or `kit-ai.tsx`) with `render`, `fields`, `uses`, `code` and search `terms`.
2. Add its icon to `icons.ts`.
3. Add any new ui module to `MODULE_EXPORTS` in `kit.tsx`, then rerun the registry dependency sync (registryDependencies = every `@/components/ui/*` imported under `src/sketchcn`).
4. Check the output with Copy prompt.

## Checks

```bash
npx tsc -b
pnpm lint
pnpm registry:build
```

## Blocks

Blocks (`blocks.ts`, data in `blocks-data.ts`, one per line) are designed sections built from parts, grouped (Headers, Sidebars, Account, Settings, Composers, Chat layouts, Empty states, Agent steps, Metrics, Chart panels, Tables, API console, Billing). `BlockList` shows them as thumbnails; inserting builds a fresh editable tree. Keep them tasteful: one primary action, muted secondary text, real copy, variants that differ in layout, not just words.

## Presets

Presets are data (`PresetSpec` in `preset.ts`): `presets-shadcn.ts` and `presets-research.ts`, one preset per line, turned into templates by `fromSpec` (fresh ids, links resolved by screen key, unknown parts reported). Each carries a `credit`; keep the README credits table in sync. `kit-app.tsx` holds the parts these layouts needed (icon rail, kanban, time slots, terminal, browser, file tree, message actions, roster, computer screen).


Our own layouts, built from kit parts. Don't copy code or assets from closed-source apps (the Codex desktop app is not open source); recreate common patterns instead.

## Interface rules

- Two worlds: the chrome (`.skc`) is ours and identical in every project; the sketch (`.skc-frame`) renders only with the host's shadcn components and theme. Chrome CSS lives in `@layer base` and excludes `.skc-frame`, so it never touches the sketch.
- Desktop-app feel: system font at 13px, 32px controls, spacing 4/8/12/16/24, neutral greys, interface text not selectable, fields without autocorrect (`plain`).
- One accent (`#3b82f6`) only for selection, drop targets and the main action (Copy prompt).
- Motion: buttons scale to .97 on press, .15s transitions on `--skc-ease`, focus ring only from the keyboard, respect reduced motion.
- Feedback is a one-line toast at the bottom. Undoable actions (delete, reset) toast with Undo instead of asking first; irreversible ones arm on the first click and fire on the second within 4s.
- Everything is reachable from ⌘K and the keyboard; Esc always steps back one level.
- Inline editing: double-click to rename, Enter or blur saves, Esc cancels.
- Drag and drop: pointer events only, 4px threshold so clicks still select, the ghost says where it will land ("in Grid"), Esc cancels, a dropped part flashes once.
- Scrollbars: thin and hidden until you hover or scroll the area (`skc-scroll`).
- Icon-first chrome: toolbar buttons are icons with a `Tip` (label + shortcut, 450ms delay, instant once warm). Only the main action (Copy prompt) has a text label.
- Density matches the component list: 28px controls, 12px text, 11px field labels; canvas labels and outlines keep a constant on-screen size at any zoom.
- State changes morph rather than flip: `IconSwap` (blur and scale), `Segmented` slides its pill, buttons keep their width when the label changes.
- Opening and closing animate from the launcher corner; the closed state is a single round launcher.
- Copy is plain and short. No emoji.
- The inspector has no section titles or helper sentences: label column on the left, controls on the right, then Link and a note.

## Layout rules for blocks and presets

- Sidebars are `surface: "sidebar"` stacks that fill the pane height. Put a `spacer` before the footer (account, settings) so it sits at the bottom.
- Lists inside sidebars use the `plain` variant; full-width ghost or secondary buttons are nav items and align left.
- Never put commas inside one item of a comma-separated prop (lists, starters): they split the item.
- On mobile, layout splits stack and a sidebar hides behind a menu button (`.skc-mobile`), matching the md: breakpoints in the prompt.
- Headers follow supersim: one 52px bar (`padding: bar`, `border: bottom`) with Section / Page at 13px (breadcrumb `title` style), small actions on the right, no big titles or descriptions. Section titles inside pages are heading level 4 with a hairline (`padding: section`). On a phone the bar stays one line.
- Check every preset at real size before shipping: no clipped text, no overlaps, no scrollbars.
