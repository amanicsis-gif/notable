import type { StudyNotes } from '@/lib/notes'

type Definition = StudyNotes['definitions'][number]
type Section = { heading?: string; sentences: string[] }

const STOPWORDS = new Set(
  `a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your many much one two three first second however example often within without well may might must make makes made can therefore called`.split(
    /\s+/,
  ),
)

const CHAPTER_HEADING = /^chapter\s+\d+\b/i
const QUESTION_HEADING = /^(what|why|how|when|where|who|which)\b[^.!]*\?$/i
const FIGURE_DESCRIPTION =
  /^(source:|figure\s+\d|exhibit\s+\d|an? (line|bar|pie)? ?(graph|chart|table|diagram|figure) (is|shows)|the (vertical|horizontal) axis|the key notes?|(two|three|four|five) lines are plotted|an? line representing|the (trend )?line (starts|ends))|\branges from\b.*\bincrements?\b|\bstarts from \(/i
const EXAMPLE_LEAD = /^(for example|for instance|consider|as an example|to illustrate)\b/i
const PRONOUN_TERM = /^(it|this|that|they|there|these|those|he|she|we|you|i|which|what|here|each|one|such|some|many|all|information)\b/i
const BAD_TERM_START = /^(however|for|in|as|therefore|that|which|and|but|or|so|thus|also|then|when|while|if|because|although|usually|often)\b/i
const DISCOURSE_LEAD =
  /^(in other words|that is|as you can see|as a result|as you learned in [^,]+|for this reason|therefore|thus|in short|in summary|we can therefore say(?: that)?)\s*,?\s*/i
const SIGNAL_WORDS =
  /\b(in other words|therefore|thus|as a result|that is|important|useful|objective|purpose|helps?|key|main|primary|goal|because)\b/i

const COPULAR_PREDICATE =
  /^(?:an?\s|one of\s|the (?:process|amount|measure|difference|sum|result|portion|practice|ability|study|set|total|method|act|state|condition|branch|value|rate)\b)/i

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length
}

function contentWords(sentence: string): string[] {
  return (sentence.toLowerCase().match(/[a-z][a-z'-]+/g) ?? []).filter((w) => w.length > 3 && !STOPWORDS.has(w))
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function ensurePeriod(value: string): string {
  const trimmed = value.trim().replace(/[,;:\s]+$/, '')
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function cleanTerm(raw: string): string | null {
  const term = raw
    .trim()
    .replace(/^(?:an?|the|its|their|our|your)\s+/i, '')
    .replace(/[.,;:]+$/, '')
    .trim()
  if (!term || wordCount(term) > 6 || term.length > 60) return null
  if (PRONOUN_TERM.test(term) || BAD_TERM_START.test(term)) return null
  if (contentWords(term).length === 0) return null
  return capitalize(term)
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\u201C])/)
    .map((s) => s.trim())
    .filter((s) => wordCount(s) >= 3)
}

function isHeadingLine(line: string): boolean {
  const words = wordCount(line)
  if (QUESTION_HEADING.test(line) && words <= 20) return true
  return !/[.!?:"\u201D)]$/.test(line) && words <= 12
}

function parse(text: string): { chapter?: string; sections: Section[] } {
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  let chapter: string | undefined
  const sections: Section[] = [{ sentences: [] }]
  const current = () => sections[sections.length - 1]

  for (const line of lines) {
    if (!chapter && CHAPTER_HEADING.test(line) && wordCount(line) <= 20) {
      chapter = line
      continue
    }
    if (isHeadingLine(line)) {
      sections.push({ heading: line, sentences: [] })
      continue
    }

    const sentences = splitSentences(line)
    if (sentences.length && FIGURE_DESCRIPTION.test(sentences[0])) continue

    for (const sentence of sentences) {
      if (QUESTION_HEADING.test(sentence) && wordCount(sentence) <= 15) {
        sections.push({ heading: sentence, sentences: [] })
        continue
      }
      if (FIGURE_DESCRIPTION.test(sentence)) continue
      current().sentences.push(sentence)
    }
  }

  return { chapter, sections: sections.filter((s) => s.sentences.length > 0) }
}

function findDefinition(sentence: string, next: string | undefined): Definition | null {
  const body = sentence.replace(/[.!?]$/, '')

  const definedAs = body.match(/^(.{2,60}?)\s+(?:is|are)\s+defined as\s+(.+)$/i)
  if (definedAs) {
    const term = cleanTerm(definedAs[1])
    if (term) return { term, definition: capitalize(ensurePeriod(definedAs[2])) }
  }

  const refersTo = body.match(/^(.{2,60}?)\s+(?:refers to|means|denotes|is the term for)\s+(.+)$/i)
  if (refersTo) {
    const term = cleanTerm(refersTo[1])
    if (term) return { term, definition: capitalize(ensurePeriod(refersTo[2])) }
  }

  const namedAs = body.match(
    /^([^,]{3,120}?)\s+(?:is|are)\s+(?:also\s+|commonly\s+|often\s+|usually\s+)?(?:called|known as|referred to as|termed)\s+([^,;]+)$/i,
  )
  if (namedAs) {
    const term = cleanTerm(namedAs[2])
    if (term && !PRONOUN_TERM.test(namedAs[1])) return { term, definition: capitalize(ensurePeriod(namedAs[1])) }
  }

  const inlineNamed = body.match(
    /^(.+?)\s*[\u2014\u2013(,]\s*(?:usually |often |commonly |also |sometimes )?(?:referred to as|called|known as|termed)\s+([^\u2014\u2013),.;]+)[\u2014\u2013),]?\s*(.*)$/i,
  )
  if (inlineNamed) {
    const term = cleanTerm(inlineNamed[2])
    let subject = inlineNamed[1].trim()
    const pronounLed = subject.match(/^(?:it|this|they|these)\s+\w+\s+(.+)$/i)
    if (pronounLed) subject = pronounLed[1]
    if (term && wordCount(subject) <= 10) {
      const tail = inlineNamed[3].trim()
      return { term, definition: capitalize(ensurePeriod(tail ? `${subject} ${tail}` : subject)) }
    }
  }

  const appositive = body.match(/^(the\s.{3,80}?),\s+([^,]{2,40}),\s+(is|are|was|were)\s+(.+)$/i)
  if (appositive) {
    const term = cleanTerm(appositive[2])
    if (term) {
      return {
        term,
        definition: capitalize(ensurePeriod(`${appositive[1]}; ${appositive[3]} ${appositive[4]}`)),
      }
    }
  }

  const copular = body.match(/^((?:an?|the)\s[^,]{2,60}?|[A-Z][^,]{1,40}?)\s+(?:is|are)\s+(.+)$/)
  if (copular && COPULAR_PREDICATE.test(copular[2])) {
    const term = cleanTerm(copular[1])
    if (term) {
      const followUp = next && /^(it|they)\s/i.test(next) ? ` ${next}` : ''
      return { term, definition: capitalize(ensurePeriod(`${copular[2]}.${followUp}`)) }
    }
  }

  return null
}

function tidySentence(sentence: string): string {
  return capitalize(ensurePeriod(sentence.replace(DISCOURSE_LEAD, '')))
}

function cleanHeading(heading: string): string {
  const lower = heading.toLowerCase()
  return ensurePeriod(capitalize(lower)).replace(/\.$/, heading.endsWith('?') ? '?' : '')
}

export function extractNotesLocally(text: string): StudyNotes {
  const { chapter, sections } = parse(text)
  const allSentences = sections.flatMap((s) => s.sentences)

  const frequency = new Map<string, number>()
  for (const sentence of allSentences) {
    for (const word of contentWords(sentence)) frequency.set(word, (frequency.get(word) ?? 0) + 1)
  }

  const definitions: Definition[] = []
  const definitionSentences = new Set<string>()
  for (const section of sections) {
    section.sentences.forEach((sentence, i) => {
      const found = findDefinition(sentence, section.sentences[i + 1])
      if (!found) return
      definitionSentences.add(sentence)
      if (definitions.some((d) => d.term.toLowerCase() === found.term.toLowerCase())) return
      definitions.push(found)
    })
  }

  const score = (sentence: string) => {
    const words = contentWords(sentence)
    if (!words.length) return 0
    const weight = words.reduce((sum, w) => sum + (frequency.get(w) ?? 0), 0) / words.length
    return weight * Math.min(words.length, 10) + (SIGNAL_WORDS.test(sentence) ? 6 : 0)
  }

  const candidatesFor = (section: Section) =>
    section.sentences
      .map((sentence, index) => ({ sentence, index, score: score(sentence) }))
      .filter(({ sentence }) => !definitionSentences.has(sentence) && !EXAMPLE_LEAD.test(sentence))
      .sort((a, b) => b.score - a.score)

  const concepts: StudyNotes['concepts'] = []
  const keyThoughts: string[] = []
  const singleSection = sections.length === 1

  for (const section of sections) {
    const ranked = candidatesFor(section)
    if (!ranked.length) continue

    let rest = ranked
    if (section.heading && QUESTION_HEADING.test(section.heading)) {
      concepts.push({ name: cleanHeading(section.heading), explanation: tidySentence(ranked[0].sentence) })
      rest = ranked.slice(1)
    }

    const take = singleSection
      ? Math.min(6, Math.max(1, Math.ceil(section.sentences.length / 4)))
      : section.sentences.length >= 4
        ? 2
        : 1

    rest
      .slice(0, take)
      .sort((a, b) => a.index - b.index)
      .forEach(({ sentence }) => keyThoughts.push(tidySentence(sentence)))
  }

  const title = chapter
    ? chapter.replace(/^chapter\s+(\d+)\s*[:.\-\u2013\u2014]?\s*/i, 'Chapter $1: ')
    : definitions.length
      ? `Study Notes: ${definitions[0].term}`
      : 'Study Notes'

  return {
    title,
    keyThoughts: keyThoughts.slice(0, 8),
    definitions,
    concepts,
    figures: [],
  }
}
