export const LINKEDIN_URL = 'https://linkedin.com/in/amanda-sisney'

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2 font-serif text-xl font-semibold text-primary">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-sans font-bold text-primary-foreground"
          >
            N
          </span>
          Notable
        </a>
        <nav aria-label="Main" className="flex items-center gap-6 text-sm">
          <a href="#how-it-works" className="hidden text-muted-foreground hover:text-foreground sm:inline">
            How it works
          </a>
          <a href="#maker" className="hidden text-muted-foreground hover:text-foreground sm:inline">
            Who made it
          </a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Read more
          </a>
        </nav>
      </div>
    </header>
  )
}
