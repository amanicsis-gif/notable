const items = ['Key thoughts', 'Definitions', 'Concepts']

export function Captures() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-center">
        <h2 className="font-serif text-3xl font-semibold text-balance">What Notable captures</h2>
        <ul className="flex flex-wrap gap-3">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full border border-primary/30 bg-secondary px-5 py-2.5 font-medium text-secondary-foreground"
            >
              {item}
            </li>
          ))}
          <li className="rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground">
            {'→ Study notes in Word'}
          </li>
        </ul>
      </div>
    </section>
  )
}
