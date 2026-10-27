import { ArrowUpRight, ClipboardPaste, FileText, Keyboard, Volume2 } from 'lucide-react'
import { LINKEDIN_URL } from './site-header'

export function Hero() {
  return (
    <section id="top" className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Desktop widget</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-balance md:text-5xl">
          Turn a textbook chapter read aloud into study notes.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
          Notable listens as your computer reads a chapter from a textbook aloud, captures the key thoughts,
          definitions, and concepts, and translates them into study notes you can export to a Word document. You can also add manual input by typing it out or copying and pasting
          it in.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Read more on LinkedIn
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
          <a href="#how-it-works" className="font-medium text-primary underline-offset-4 hover:underline">
            How it works
          </a>
        </div>
      </div>

      <div aria-hidden="true" className="relative">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="font-serif text-lg font-semibold text-primary">Notable</span>
            <span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Volume2 className="size-3.5" />
              Listening
            </span>
          </div>
          <div className="mt-6 flex h-12 items-end gap-1">
            {[40, 70, 55, 90, 35, 65, 80, 45, 60, 95, 50, 70, 40, 85, 55, 30, 65, 75, 45, 60].map((h, i) => (
              <span key={i} className="flex-1 rounded-sm bg-primary/70" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <Keyboard className="size-3.5" />
                Manual input
              </p>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ClipboardPaste className="size-3.5" />
                Type or paste
              </span>
            </div>
            <div className="mt-2 rounded-lg border border-dashed border-primary/40 bg-background p-3">
              <div className="h-2 w-10/12 rounded bg-border" />
              <div className="mt-1.5 h-2 w-3/4 rounded bg-border" />
              <div className="mt-1.5 flex items-center gap-0.5">
                <div className="h-2 w-1/3 rounded bg-border" />
                <span className="h-3.5 w-px animate-pulse bg-primary" />
              </div>
            </div>
          </div>
          <ul className="mt-6 flex flex-col gap-4">
            {['Key thoughts', 'Definitions', 'Concepts'].map((label) => (
              <li key={label} className="rounded-lg bg-muted p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
                <div className="mt-2 h-2 w-11/12 rounded bg-border" />
                <div className="mt-1.5 h-2 w-2/3 rounded bg-border" />
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-center gap-2 rounded-md border border-primary py-2.5 text-sm font-medium text-primary">
            <FileText className="size-4" />
            Export to Word
          </div>
        </div>
      </div>
    </section>
  )
}
