import { Ear, FileDown, NotebookPen } from 'lucide-react'

const steps = [
  {
    icon: Ear,
    title: 'Listen',
    body: 'Notable listens as your computer reads a chapter from a textbook aloud.',
  },
  {
    icon: NotebookPen,
    title: 'Capture',
    body: 'It captures key thoughts, definitions, and concepts and translates them into study notes.',
  },
  {
    icon: FileDown,
    title: 'Export',
    body: 'Your study notes can be exported into a Word document.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-card">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-serif text-3xl font-semibold">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-xl border border-border bg-background p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-serif text-2xl text-primary/40">{`0${i + 1}`}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
