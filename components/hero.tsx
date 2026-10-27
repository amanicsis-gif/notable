import { ArrowUpRight } from 'lucide-react'
import { NotableWidget } from './notable-widget'
import { LINKEDIN_URL } from './site-header'

export function Hero() {
  return (
    <section id="top" className="mx-auto grid max-w-5xl items-start gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Desktop widget</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-balance md:text-5xl">
          A Notable study buddy for all your note-taking needs.
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

      <NotableWidget />
    </section>
  )
}
