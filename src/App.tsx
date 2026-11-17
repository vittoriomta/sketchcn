import { Sketch } from "@/sketchcn"

export default function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Your app</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This stands in for your project. Press <kbd className="rounded border px-1 font-mono text-xs">S</kbd> to sketch a screen with its shadcn components.
      </p>
      <Sketch defaultOpen />
    </div>
  )
}
