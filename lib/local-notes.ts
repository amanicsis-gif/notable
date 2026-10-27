import type { StudyNotes } from '@/lib/notes'

const STOPWORDS = new Set(
  `a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your called refers means defined known used uses using include includes including many much one two three first second however example often called within without well may might must make makes made`.split(
    /\s+/,
  ),
)

const PRONOUN_START = /^(it|this|that|they|there|these|those|he|she|we|you|i|which|what|here|each|one)\b/i

const DEFINITION_PATTERN =
  /^(?:an?\s+|the\s+)?([a-z][\w\s'-]{1,50}?)\s+(?:is defined as|is known as|refers to|is|are|means)\s+(.{8,})$/i

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.split(' ').length >= 4)
}

function words(sentence: string): string[] {
  return sentence.toLowerCase().match(/[a-z][a-z'-]+/g) ?? []
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function ensurePeriod(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`
}

export function extractNotesLocally(text: string): StudyNotes {
  const sentences = splitSentences(text)

  const frequency = new Map<string, number>()
  for (const sentence of sentences) {
    for (const word of words(sentence)) {
      if (word.length < 4 || STOPWORDS.has(word)) continue
      frequency.set(word, (frequency.get(word) ?? 0) + 1)
    }
  }

  const definitions: StudyNotes['definitions'] = []
  const definitionSentences = new Set<string>()
  for (const sentence of sentences) {
    const match = sentence.match(DEFINITION_PATTERN)
    if (!match) continue
    const term = match[1].trim()
    if (PRONOUN_START.test(term) || term.split(/\s+/).length > 5) continue
    if (definitions.some((d) => d.term.toLowerCase() === term.toLowerCase())) continue
    definitions.push({ term: capitalize(term), definition: capitalize(ensurePeriod(match[2].trim())) })
    definitionSentences.add(sentence)
  }

  const scored = sentences
    .map((sentence, index) => {
      const terms = words(sentence).filter((w) => frequency.has(w))
      const score = terms.reduce((sum, w) => sum + (frequency.get(w) ?? 0), 0) / Math.max(terms.length, 1)
      return { sentence, index, score: score * Math.min(terms.length, 8) }
    })
    .filter(({ sentence }) => !definitionSentences.has(sentence))

  const keyThoughts = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.index - b.index)
    .map(({ sentence }) => ensurePeriod(sentence))

  const definedTerms = new Set(definitions.flatMap((d) => words(d.term)))
  const topKeywords = [...frequency.entries()]
    .filter(([word, count]) => count >= 2 && word.length > 4)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)

  const concepts: StudyNotes['concepts'] = []
  const usedConceptSentences = new Set<string>()
  for (const keyword of topKeywords) {
    if (concepts.length >= 4) break
    if (definedTerms.has(keyword)) continue
    const explanation = sentences.find(
      (s) => words(s).includes(keyword) && !definitionSentences.has(s) && !usedConceptSentences.has(s),
    )
    if (!explanation) continue
    usedConceptSentences.add(explanation)
    concepts.push({ name: capitalize(keyword), explanation: ensurePeriod(explanation) })
  }

  const titleWords = (definitions.length ? [definitions[0].term] : []).concat(
    topKeywords.slice(0, 2).map(capitalize),
  )
  const uniqueTitleWords = [...new Set(titleWords.map((w) => w.toLowerCase()))]
    .slice(0, 2)
    .map((w) => titleWords.find((t) => t.toLowerCase() === w) ?? w)

  return {
    title: uniqueTitleWords.length ? `Study Notes: ${uniqueTitleWords.join(' & ')}` : 'Study Notes',
    keyThoughts,
    definitions,
    concepts,
  }
}
