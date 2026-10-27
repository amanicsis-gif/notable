import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { HowItWorks } from '@/components/how-it-works'
import { Captures } from '@/components/captures'
import { Maker } from '@/components/maker'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Captures />
        <Maker />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground">
          {'© Notable · Made by Amanda Sisney'}
        </div>
      </footer>
    </>
  )
}
