import { ArrowUpRight } from 'lucide-react'
import { LINKEDIN_URL } from './site-header'

export function Maker() {
  return (
    <section id="maker" className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-20 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest opacity-80">Who made it</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold">Amanda Sisney</h2>
          <p className="mt-3 opacity-80">See more about Notable and its maker on LinkedIn.</p>
        </div>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-md bg-primary-foreground px-5 py-3 font-medium text-primary transition-opacity hover:opacity-90 md:self-auto"
        >
          linkedin.com/in/amanda-sisney
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
