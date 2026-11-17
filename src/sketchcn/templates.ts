// Templates: ready-made sets of screens, already linked into a flow, built only from kit parts.

import type { NavItem, Props, Screen, Shell, SketchNode } from "./format"
import { uid } from "./format"
import { createNode } from "./kit"
import { fromSpec } from "./preset"
import { SHADCN_PRESETS } from "./presets-shadcn"
import { RESEARCH_PRESETS } from "./presets-research"

export type Template = {
  id: string
  name: string
  description: string
  category?: "Starter" | "App" | "AI"
  /** Where the layout was studied from. */
  credit?: string
  /** Screens plus the app nav they expect, built fresh each time (new ids). */
  build: () => { screens: Screen[]; nav: NavItem[]; app?: string }
}

type Extra = Partial<Pick<SketchNode, "link" | "note" | "align">>

/** Build a node: n("button", { label: "Save" }, [], { link }) */
function n(type: string, props: Props = {}, children?: SketchNode[], extra: Extra = {}): SketchNode {
  const node = createNode(type)
  return { ...node, props: { ...node.props, ...props }, ...(children ? { children } : {}), ...extra }
}

function screen(id: string, name: string, path: string, shell: Shell, purpose: string, children: SketchNode[], gap = "lg"): Screen {
  return { id, name, path, device: "desktop", shell, purpose, root: n("stack", { gap }, children) }
}

// ── Auth ──────────────────────────────────────────────────────────────────

const auth: Template = {
  id: "auth",
  category: "Starter",
  name: "Auth",
  description: "Sign in, sign up, reset password and a one-time code, linked together.",
  build: () => {
    const [signIn, signUp, forgot, verify] = [uid(), uid(), uid(), uid()]
    const provider = (label: string) => n("button", { label, variant: "outline", full: true }, undefined, { note: "OAuth sign-in with this provider" })
    return {
      nav: [],
      screens: [
        screen(signIn, "Sign in", "/sign-in", "none", "Returning users sign in with email or a provider", [
          n("center", { width: "sm", gap: "lg" }, [
            n("stack", { gap: "sm" }, [n("heading", { text: "Welcome back", level: "1" }), n("text", { text: "Sign in to your account to continue.", muted: true })]),
            n("stack", { gap: "sm" }, [provider("Continue with Google"), provider("Continue with GitHub")]),
            n("marker", { text: "or", variant: "separator" }),
            n("stack", { gap: "md" }, [
              n("input", { label: "Email", placeholder: "you@example.com", type: "email" }),
              n("input", { label: "Password", placeholder: "••••••••", type: "password" }),
              n("row", { justify: "between" }, [
                n("checkbox", { label: "Remember me" }),
                n("button", { label: "Forgot password?", variant: "link", size: "sm" }, undefined, { link: forgot }),
              ]),
              n("button", { label: "Sign in", full: true }, undefined, { note: "Shows field errors inline; on success goes to the app" }),
            ]),
            n("row", { justify: "center", gap: "sm" }, [
              n("text", { text: "Don't have an account?", muted: true }),
              n("button", { label: "Sign up", variant: "link", size: "sm" }, undefined, { link: signUp }),
            ]),
          ]),
        ]),
        screen(signUp, "Sign up", "/sign-up", "none", "New users create an account", [
          n("center", { width: "sm", gap: "lg" }, [
            n("stack", { gap: "sm" }, [n("heading", { text: "Create an account", level: "1" }), n("text", { text: "Start your 14-day free trial. No card needed.", muted: true })]),
            n("stack", { gap: "md" }, [
              n("grid", { cols: 2, gap: "md" }, [n("input", { label: "First name", placeholder: "Olivia" }), n("input", { label: "Last name", placeholder: "Martin" })]),
              n("input", { label: "Work email", placeholder: "olivia@company.com", type: "email" }),
              n("input", { label: "Password", placeholder: "At least 8 characters", type: "password" }),
              n("checkbox", { label: "I agree to the Terms and Privacy Policy" }),
              n("button", { label: "Create account", full: true }, undefined, { link: verify, note: "Sends a 6-digit code to the email" }),
            ]),
            n("row", { justify: "center", gap: "sm" }, [
              n("text", { text: "Already have an account?", muted: true }),
              n("button", { label: "Sign in", variant: "link", size: "sm" }, undefined, { link: signIn }),
            ]),
          ]),
        ]),
        screen(forgot, "Forgot password", "/forgot-password", "none", "Request a reset link", [
          n("center", { width: "sm", gap: "lg" }, [
            n("stack", { gap: "sm" }, [n("heading", { text: "Reset your password", level: "1" }), n("text", { text: "We'll email you a link to choose a new one.", muted: true })]),
            n("input", { label: "Email", placeholder: "you@example.com", type: "email" }),
            n("button", { label: "Send reset link", full: true }, undefined, { note: "Always shows the same confirmation, whether or not the email exists" }),
            n("button", { label: "Back to sign in", variant: "ghost", full: true }, undefined, { link: signIn }),
          ]),
        ]),
        screen(verify, "Verify email", "/verify", "none", "Enter the code sent by email", [
          n("center", { width: "sm", gap: "lg" }, [
            n("stack", { gap: "sm" }, [n("heading", { text: "Check your email", level: "1" }), n("text", { text: "We sent a 6-digit code to olivia@company.com.", muted: true })]),
            n("input-otp", { label: "", length: 6 }, undefined, { note: "Auto-submits on the sixth digit" }),
            n("button", { label: "Verify", full: true }, undefined, { link: signIn }),
            n("row", { justify: "center", gap: "sm" }, [n("text", { text: "Didn't get it?", muted: true }), n("button", { label: "Resend code", variant: "link", size: "sm" })]),
          ]),
        ]),
      ],
    }
  },
}

// ── Dashboard ─────────────────────────────────────────────────────────────

const dashboard: Template = {
  id: "dashboard",
  category: "Starter",
  name: "Dashboard",
  description: "Overview, customers list, customer detail and settings, in a sidebar app.",
  build: () => {
    const [overview, customers, detail, settings] = [uid(), uid(), uid(), uid()]
    return {
      app: "Acme",
      nav: [
        { id: uid(), label: "Overview", link: overview },
        { id: uid(), label: "Customers", link: customers },
        { id: uid(), label: "Settings", link: settings },
      ],
      screens: [
        screen(overview, "Overview", "/dashboard", "sidebar", "Key numbers, revenue trend and latest activity", [
          n("row", { justify: "between" }, [
            n("heading", { text: "Overview", level: "1" }),
            n("row", { gap: "sm" }, [n("toggle-group", { options: "7 days, 30 days, 12 months", variant: "outline" }), n("button", { label: "Download" })]),
          ]),
          n("grid", { cols: 4, gap: "md" }, [
            n("stat", { label: "Total revenue", value: "$45,231.89", delta: "+20.1% from last month" }),
            n("stat", { label: "Subscriptions", value: "+2,350", delta: "+180.1% from last month" }),
            n("stat", { label: "Sales", value: "+12,234", delta: "+19% from last month" }),
            n("stat", { label: "Active now", value: "573", delta: "+201 since last hour" }),
          ]),
          n("split", { layout: "main-aside", gap: "md" }, [
            n("card", { title: "Revenue", description: "Monthly, last 12 months" }, [n("chart", { title: "", kind: "area" })]),
            n("card", { title: "Recent sales", description: "265 sales this month" }, [
              n("list", { items: "Olivia Martin, Jackson Lee, Isabella Nguyen, William Kim", description: "+$1,999.00", action: "", variant: "default" }),
            ]),
          ]),
          n("card", { title: "Latest customers", description: "" }, [
            n("table", { columns: "Customer, Email, Status, Amount", rows: 5 }, undefined, { link: detail, note: "Clicking a row opens the customer" }),
          ]),
        ]),
        screen(customers, "Customers", "/customers", "sidebar", "Search, filter and page through customers", [
          n("row", { justify: "between" }, [
            n("stack", { gap: "sm" }, [n("heading", { text: "Customers", level: "1" }), n("text", { text: "2,350 customers", muted: true })]),
            n("button", { label: "Add customer" }),
          ]),
          n("row", { justify: "between" }, [
            n("input-group", { placeholder: "Search customers…", shortcut: "" }),
            n("toggle-group", { options: "All, Active, Paused", variant: "outline" }),
          ]),
          n("table", { columns: "Customer, Email, Status, Created, Amount", rows: 8 }, undefined, { link: detail }),
          n("pagination", { pages: 24, current: 1 }),
        ]),
        screen(detail, "Customer", "/customers/[id]", "sidebar", "Everything about one customer", [
          n("breadcrumb", { path: "Customers, Olivia Martin" }),
          n("row", { justify: "between" }, [
            n("row", { gap: "md" }, [n("avatar", { name: "Olivia Martin", showName: false }), n("stack", { gap: "sm" }, [n("heading", { text: "Olivia Martin", level: "2" }), n("text", { text: "olivia@example.com · Customer since 2024", muted: true })])]),
            n("row", { gap: "sm" }, [n("button", { label: "Message", variant: "outline" }), n("dropdown", { trigger: "More", items: "Edit, Export data, Pause subscription, Delete customer" })]),
          ]),
          n("tabs", { tabs: "Overview, Invoices, Activity" }, [
            n("grid", { cols: 3, gap: "md" }, [
              n("stat", { label: "Lifetime value", value: "$8,420.00", delta: "" }),
              n("stat", { label: "Plan", value: "Pro", delta: "Renews Dec 1" }),
              n("stat", { label: "Open tickets", value: "2", delta: "" }),
            ]),
            n("card", { title: "Invoices", description: "" }, [n("table", { columns: "Invoice, Date, Status, Amount", rows: 4 })]),
          ]),
        ]),
        screen(settings, "Settings", "/settings", "sidebar", "Workspace, notifications and danger zone", [
          n("heading", { text: "Settings", level: "1" }),
          n("tabs", { tabs: "General, Notifications, Billing" }, [
            n("card", { title: "Workspace", description: "Shown on invoices and emails." }, [
              n("grid", { cols: 2, gap: "md" }, [n("input", { label: "Name", placeholder: "Acme Inc." }), n("input", { label: "Website", placeholder: "acme.com" })]),
              n("row", { justify: "end" }, [n("button", { label: "Save" })]),
            ]),
            n("card", { title: "Notifications", description: "" }, [
              n("switch", { label: "Product updates", description: "News about features and changes." }),
              n("switch", { label: "Weekly report", description: "A summary every Monday." }),
            ]),
            n("card", { title: "Danger zone", description: "These actions can't be undone." }, [
              n("row", { justify: "between" }, [n("text", { text: "Delete this workspace and all of its data.", muted: true }), n("button", { label: "Delete workspace", variant: "destructive" })]),
            ]),
          ]),
        ]),
      ],
    }
  },
}

// ── AI apps ───────────────────────────────────────────────────────────────
// Full-bleed layouts made of panes, the way agent apps are actually built.

/** A pane: a padded stack, optionally on a surface. */
const pane = (children: SketchNode[], surface = "none", gap = "md") => n("stack", { gap, padding: "md", surface }, children)
const brand = (name: string) => n("row", { justify: "between", gap: "sm" }, [n("heading", { text: name, level: "3" }), n("button", { label: "New", size: "sm", variant: "outline" })])

const chat: Template = {
  id: "ai-chat",
  category: "AI",
  name: "AI chat",
  description: "A chat app: a welcome screen with starters, and a conversation with history, reasoning, sources and files.",
  build: () => {
    const [home, thread] = [uid(), uid()]
    const sidebar = (active: number) =>
      pane(
        [
          brand("Assistant"),
          n("input-group", { placeholder: "Search chats", shortcut: "⌘K" }),
          n("threads", { today: "Q3 revenue by region, Launch email draft", earlier: "Explain our pricing tiers, Churn analysis, Hiring plan for Q1, Onboarding checklist", active, running: 0 }, undefined, {
            link: thread,
          }),
          n("separator"),
          n("avatar", { name: "Olivia Martin", showName: true }),
        ],
        "sidebar",
      )
    const prompt = (placeholder: string) => n("prompt", { placeholder, model: "Claude Opus 5.5", attach: true }, undefined, { note: "Enter sends, Shift+Enter adds a line; Stop replaces Send while streaming" })
    return {
      app: "Assistant",
      nav: [],
      screens: [
        screen(home, "New chat", "/", "full", "Empty state: greet, offer starters, ask", [
          n("split", { layout: "sidebar-main", gap: "none", dividers: true, fill: true }, [
            sidebar(0),
            n("center", { width: "lg", gap: "lg" }, [
              n("stack", { gap: "sm" }, [n("heading", { text: "Good afternoon, Olivia", level: "1" }, undefined, { align: "center" }), n("text", { text: "What should we work on?", muted: true }, undefined, { align: "center" })]),
              prompt("Ask anything, or drop a file…"),
              n("starters", { items: "Analyze data — Upload a CSV and get charts, Write — Draft an email or a post, Summarize — Turn a long doc into key points, Plan — Break a project into steps" }, undefined, { link: thread }),
            ]),
          ]),
        ]),
        screen(thread, "Chat", "/c/[id]", "full", "A conversation with the assistant", [
          n("split", { layout: "sidebar-main", gap: "none", dividers: true, fill: true }, [
            sidebar(1),
            n("stack", { gap: "lg", padding: "lg" }, [
              n("row", { justify: "between" }, [
                n("heading", { text: "Q3 revenue by region", level: "3" }),
                n("button-group", { labels: "Share, ···" }, undefined, { note: "··· opens: export as PDF, rename, delete" }),
              ]),
              n("stack", { gap: "lg", width: "reading" }, [
                n("conversation", {}, [
                  n("marker", { text: "Today", variant: "separator" }),
                  n("message", { role: "user", text: "How did each region do in Q3? Attached the export." }),
                  n("attachment", { name: "q3-orders.csv", meta: "CSV · 1.2 MB", state: "done" }, undefined, { align: "end" }),
                  n("reasoning", { title: "Thought for 7 seconds", status: "done", detail: "Grouped 48,210 orders by region and compared with Q2." }),
                  n("tool", { name: "run_python", status: "done", detail: "chart.png", args: "df.groupby('region').total.sum()" }),
                  n("message", { role: "assistant", name: "Assistant", text: "Europe grew fastest (+18% vs Q2) and is now your second-largest region. North America is flat; Asia Pacific dipped 4%, all in September." }),
                  n("chart", { title: "Revenue by region, Q2 vs Q3", kind: "bar" }),
                  n("sources", { items: "q3-orders.csv, Finance wiki, Q2 board deck" }),
                ]),
                n("suggestions", { items: "Why did APAC dip?, Make a slide, Compare with last year" }),
                prompt("Reply…"),
              ]),
            ]),
          ]),
        ]),
      ],
    }
  },
}

const coding: Template = {
  id: "coding-agent",
  category: "AI",
  name: "Coding agent",
  description: "Background coding agent: a task queue, a live run with tool calls and a diff to review, plus approvals and settings.",
  build: () => {
    const [tasks, review, settings] = [uid(), uid(), uid()]
    return {
      app: "Forge",
      nav: [],
      screens: [
        screen(tasks, "Tasks", "/", "full", "Hand work to the agent and watch it run", [
          n("split", { layout: "sidebar-main-aside", gap: "none", dividers: true, fill: true }, [
            pane(
              [
                brand("Forge"),
                n("toggle-group", { options: "Active, Review, Done", variant: "outline" }),
                n("tasks", {
                  items: "Fix flaky checkout test, Add CSV export to reports, Upgrade to React 20, Remove dead feature flags",
                  statuses: "running, review, done, failed",
                  repo: "acme/web",
                }, undefined, { link: review }),
                n("button", { label: "Settings", variant: "ghost", size: "sm" }, undefined, { link: settings }),
              ],
              "sidebar",
            ),
            n("stack", { gap: "lg", padding: "lg" }, [
              n("stack", { gap: "sm" }, [
                n("row", { justify: "between" }, [n("heading", { text: "Fix flaky checkout test", level: "2" }), n("badge", { text: "Running", variant: "secondary" })]),
                n("text", { text: "acme/web · fix/checkout-race · started 2 minutes ago by Olivia", muted: true }),
              ]),
              n("conversation", {}, [
                n("message", { role: "user", text: "The checkout test fails about one run in five. Find out why and fix it." }),
                n("reasoning", { title: "Planned 3 steps", status: "done", detail: "Reproduce the failure, find the race, fix it and prove it with 20 runs." }),
                n("tool", { name: "run_tests", status: "error", detail: "4 of 20 failed", args: '{ "pattern": "checkout", "repeat": 20 }' }),
                n("tool", { name: "edit_file", status: "done", detail: "+3 −1", args: '{ "path": "tests/checkout.spec.ts" }' }),
                n("tool", { name: "run_tests", status: "running", detail: "", args: '{ "pattern": "checkout", "repeat": 20 }' }),
              ]),
              n("prompt", { placeholder: "Steer the agent…", model: "Claude Opus 5.5", attach: false }, undefined, { note: "Messages sent mid-run are queued for the next step" }),
            ]),
            pane([
              n("row", { justify: "between" }, [n("heading", { text: "Changes", level: "3" }), n("button", { label: "Review", size: "sm" }, undefined, { link: review })]),
              n("diff", {}),
              n("approval", {
                title: "Push to fix/checkout-race?",
                description: "The agent wants to push 1 commit and open a draft PR.",
                command: "git push -u origin fix/checkout-race",
              }),
            ], "muted"),
          ]),
        ]),
        screen(review, "Review", "/tasks/[id]/review", "full", "Review the agent's changes before merging", [
          n("split", { layout: "main-aside", gap: "none", dividers: true, fill: true }, [
            n("stack", { gap: "lg", padding: "lg" }, [
              n("breadcrumb", { path: "Tasks, Fix flaky checkout test, Review" }),
              n("row", { justify: "between" }, [
                n("heading", { text: "2 files changed", level: "2" }),
                n("button-group", { labels: "Request changes, Merge" }, undefined, { note: "Merge squashes into main and closes the task" }),
              ]),
              n("diff", {}),
              n("diff", {
                file: "src/lib/pay.ts",
                code: "  export async function pay(cart: Cart) {\n-   return fetch('/pay', { body })\n+   const res = await fetch('/pay', { body })\n+   if (!res.ok) throw new PaymentError(res.status)\n+   return res\n  }",
              }),
            ]),
            pane([
              n("heading", { text: "Summary", level: "3" }),
              n("text", { text: "The test raced the payment mock. It now waits for the /pay response instead of a fixed 2s timeout, and pay() surfaces HTTP errors.", muted: false }),
              n("list", { items: "Tests · 214 passed, Checkout repeated · 20 of 20, Lint · clean", description: "", action: "", variant: "default" }),
              n("textarea", { label: "Leave a comment for the agent", placeholder: "e.g. also cover the 3DS flow" }),
              n("button", { label: "Send to agent", variant: "outline", full: true }),
            ], "muted"),
          ]),
        ]),
        screen(settings, "Settings", "/settings", "full", "What the agent may do on its own", [
          n("center", { width: "lg", gap: "lg" }, [
            n("stack", { gap: "sm" }, [n("heading", { text: "Agent settings", level: "1" }), n("text", { text: "Defaults for every new task in acme/web.", muted: true })]),
            n("card", { title: "Model", description: "" }, [
              n("select", { label: "Model", placeholder: "Claude Opus 5.5", options: "Claude Opus 5.5, Claude Sonnet 5.5, Claude Haiku 5.5" }),
              n("slider", { label: "Reasoning effort", value: 70 }),
            ]),
            n("card", { title: "Permissions", description: "Anything off asks you first." }, [
              n("switch", { label: "Run tests and linters", description: "Read-only." }),
              n("switch", { label: "Edit files in a branch", description: "Never on main." }),
              n("switch", { label: "Push and open draft PRs", description: "Asks first by default." }),
              n("switch", { label: "Run database migrations", description: "Staging only." }),
            ]),
            n("row", { justify: "end", gap: "sm" }, [n("button", { label: "Cancel", variant: "outline" }, undefined, { link: tasks }), n("button", { label: "Save" }, undefined, { link: tasks })]),
          ]),
        ]),
      ],
    }
  },
}

const ops: Template = {
  id: "agent-ops",
  category: "AI",
  name: "Agent ops",
  description: "Watch a fleet of agents: health, spend, failing runs, and a step-by-step trace of any run.",
  build: () => {
    const [overview, runs, run] = [uid(), uid(), uid()]
    return {
      app: "Fleet",
      nav: [
        { id: uid(), label: "Overview", link: overview },
        { id: uid(), label: "Runs", link: runs },
        { id: uid(), label: "Agents" },
        { id: uid(), label: "Evals" },
      ],
      screens: [
        screen(overview, "Overview", "/", "sidebar", "Is the fleet healthy right now?", [
          n("row", { justify: "between" }, [n("heading", { text: "Overview", level: "1" }), n("toggle-group", { options: "24h, 7d, 30d", variant: "outline" })]),
          n("alert", { title: "Support agent: 12 failed runs in the last hour", description: "Most fail on the refunds tool with a timeout.", variant: "destructive" }, undefined, { link: runs }),
          n("grid", { cols: 4, gap: "md" }, [
            n("stat", { label: "Runs", value: "3,482", delta: "+12% vs yesterday" }),
            n("stat", { label: "Success rate", value: "96.1%", delta: "−1.4 pts" }),
            n("stat", { label: "p50 duration", value: "41s", delta: "−6s" }),
            n("stat", { label: "Spend", value: "$318.40", delta: "of $500 budget" }),
          ]),
          n("split", { layout: "main-aside", gap: "md" }, [
            n("card", { title: "Runs per hour", description: "Succeeded and failed" }, [n("chart", { title: "", kind: "bar" })]),
            n("card", { title: "Agents", description: "" }, [
              n("list", { items: "Support agent, Coding agent, Research agent, Triage bot", description: "Healthy", action: "", variant: "default" }),
            ]),
          ]),
        ]),
        screen(runs, "Runs", "/runs", "sidebar", "Every run, filterable", [
          n("row", { justify: "between" }, [n("heading", { text: "Runs", level: "1" }), n("input-group", { placeholder: "Filter by agent, user or tool", shortcut: "/" })]),
          n("toggle-group", { options: "All, Running, Failed, Needs approval", variant: "outline" }),
          n("table", { columns: "Run, Agent, Status, Duration, Cost, Created", rows: 8 }, undefined, { link: run, note: "Failed rows first; click opens the trace" }),
          n("pagination", { pages: 40, current: 1 }),
        ]),
        screen(run, "Run trace", "/runs/[id]", "sidebar", "One run, step by step, with timing and tokens", [
          n("breadcrumb", { path: "Runs, run_8f2c" }),
          n("row", { justify: "between" }, [
            n("row", { gap: "md" }, [n("heading", { text: "Support agent · refund request", level: "2" }), n("badge", { text: "Failed", variant: "destructive" })]),
            n("button-group", { labels: "Replay, Open in evals" }),
          ]),
          n("split", { layout: "main-aside", gap: "lg" }, [
            n("stack", { gap: "md" }, [
              n("marker", { text: "10:42:07 · started by webhook", variant: "separator" }),
              n("message", { role: "user", text: "I was charged twice for order #4127, please refund one." }),
              n("reasoning", { title: "Thought for 3 seconds", status: "done", detail: "Look up the order, confirm the duplicate charge, refund the second one." }),
              n("tool", { name: "get_order", status: "done", detail: "180ms", args: '{ "id": 4127 }' }),
              n("tool", { name: "refund_payment", status: "error", detail: "timeout after 30s", args: '{ "charge": "ch_9a1", "amount": 4900 }' }),
              n("marker", { text: "10:42:41 · failed", variant: "separator" }),
            ]),
            n("stack", { gap: "md" }, [
              n("card", { title: "Run", description: "" }, [n("list", { items: "Model · Atlas 4 Pro, Tokens · 6.2k, Cost · $0.04, Duration · 34s", description: "", action: "", variant: "plain" })]),
              n("code", { title: "error.txt", code: "RefundTimeout: payments API did not\nrespond within 30000ms (ch_9a1)" }),
            ]),
          ]),
        ]),
      ],
    }
  },
}

const builder: Template = {
  id: "agent-builder",
  category: "AI",
  name: "Agent builder",
  description: "Configure an agent with a live test chat beside it, and an inbox of actions waiting for approval.",
  build: () => {
    const [build, inbox] = [uid(), uid()]
    return {
      app: "Studio",
      nav: [
        { id: uid(), label: "Build", link: build },
        { id: uid(), label: "Approvals", link: inbox },
      ],
      screens: [
        screen(build, "Build", "/agents/support", "full", "Edit the agent and try it at the same time", [
          n("split", { layout: "halves", gap: "none", dividers: true, fill: true }, [
            n("stack", { gap: "lg", padding: "lg" }, [
              n("row", { justify: "between" }, [
                n("stack", { gap: "sm" }, [n("heading", { text: "Support agent", level: "2" }), n("text", { text: "Draft · last saved 2 minutes ago", muted: true })]),
                n("button-group", { labels: "Discard, Publish" }),
              ]),
              n("tabs", { tabs: "Instructions, Tools, Knowledge, Evals" }, [
                n("textarea", { label: "Instructions", placeholder: "You help customers with orders and refunds. Be brief. Never refund more than the order total." }),
                n("select", { label: "Model", placeholder: "Claude Sonnet 5.5", options: "Claude Opus 5.5, Claude Sonnet 5.5, Claude Haiku 5.5" }),
                n("card", { title: "Tools", description: "MCP servers and functions the agent can call" }, [
                  n("switch", { label: "Orders (MCP)", description: "get_order, list_orders" }),
                  n("switch", { label: "Payments (MCP)", description: "refund_payment · needs approval" }),
                  n("switch", { label: "Web search", description: "" }),
                ]),
                n("attachment", { name: "refund-policy.pdf", meta: "PDF · 340 KB · indexed", state: "done" }),
              ]),
            ]),
            pane([
              n("row", { justify: "between" }, [n("heading", { text: "Test", level: "3" }), n("button", { label: "Reset", size: "sm", variant: "ghost" })]),
              n("conversation", {}, [
                n("message", { role: "user", text: "I was charged twice for order #4127." }),
                n("tool", { name: "get_order", status: "done", detail: "180ms", args: '{ "id": 4127 }' }),
                n("approval", { title: "Refund $49.00 to the customer?", description: "refund_payment needs approval in this agent.", command: 'refund_payment({ charge: "ch_9a1", amount: 4900 })' }),
              ]),
              n("prompt", { placeholder: "Message the draft agent…", model: "", attach: false }),
            ], "muted", "lg"),
          ]),
        ]),
        screen(inbox, "Approvals", "/approvals", "sidebar", "Actions agents are waiting on", [
          n("row", { justify: "between" }, [n("stack", { gap: "sm" }, [n("heading", { text: "Approvals", level: "1" }), n("text", { text: "3 waiting · agents pause until you decide", muted: true })]), n("toggle-group", { options: "Waiting, Decided", variant: "outline" })]),
          n("approval", { title: "Refund $49.00 for order #4127?", description: "Support agent · duplicate charge confirmed · 2m ago", command: 'refund_payment({ charge: "ch_9a1", amount: 4900 })' }),
          n("approval", { title: "Push to fix/checkout-race?", description: "Coding agent · 1 commit, tests pass · 6m ago", command: "git push -u origin fix/checkout-race" }),
          n("approval", { title: "Email 1,240 customers?", description: "Marketing agent · launch announcement · 20m ago", command: 'send_campaign({ list: "beta", template: "launch" })' }),
        ]),
      ],
    }
  },
}

// Researched presets first; the hand-built ones fill in until their researched versions land.
const ORDER = ["Starter", "App", "AI"]
export const TEMPLATES: Template[] = [...SHADCN_PRESETS.map(fromSpec), ...RESEARCH_PRESETS.map(fromSpec), ops].sort(
  (a, b) => ORDER.indexOf(a.category ?? "Starter") - ORDER.indexOf(b.category ?? "Starter"),
)

// The earlier hand-built Auth and Dashboard are superseded by the shadcn-studied versions.
void auth
void dashboard
// Superseded by the researched AI chat, Coding agent and Agent builder.
void chat
void coding
void builder
