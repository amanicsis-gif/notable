'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Keyboard, Loader2, Mic, Sparkles, Square, Trash2 } from 'lucide-react'
import type { StudyNotes } from '@/lib/notes'
import { exportNotesToWord } from '@/lib/export-docx'

type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: { resultIndex: number; results: RecognitionResultList }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionConstructor = new () => SpeechRecognitionLike

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function NotableWidget() {
  const [isSupported, setIsSupported] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [manualText, setManualText] = useState('')
  const [notes, setNotes] = useState<StudyNotes | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const shouldListenRef = useRef(false)

  useEffect(() => {
    setIsSupported(getRecognitionConstructor() !== null)
    return () => {
      shouldListenRef.current = false
      recognitionRef.current?.stop()
    }
  }, [])

  function startListening() {
    const Recognition = getRecognitionConstructor()
    if (!Recognition) return

    setError(null)
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalText += result[0].transcript
        else interimText += result[0].transcript
      }
      if (finalText) setTranscript((prev) => `${prev} ${finalText.trim()}`.trim())
      setInterim(interimText)
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListenRef.current = false
        setError('Microphone access was blocked. Allow microphone access in your browser to listen.')
      }
    }

    recognition.onend = () => {
      if (shouldListenRef.current) {
        recognition.start()
      } else {
        setIsListening(false)
        setInterim('')
      }
    }

    recognitionRef.current = recognition
    shouldListenRef.current = true
    recognition.start()
    setIsListening(true)
  }

  function stopListening() {
    shouldListenRef.current = false
    recognitionRef.current?.stop()
  }

  async function generateNotes() {
    const text = [transcript, manualText].map((t) => t.trim()).filter(Boolean).join('\n\n')
    if (!text) {
      setError('Listen to a chapter or add manual input first.')
      return
    }

    setError(null)
    setIsGenerating(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not generate notes.')
      setNotes(data as StudyNotes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate notes.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleExport() {
    if (!notes) return
    setIsExporting(true)
    try {
      await exportNotesToWord(notes)
    } catch {
      setError('Could not export the Word document.')
    } finally {
      setIsExporting(false)
    }
  }

  function clearAll() {
    stopListening()
    setTranscript('')
    setInterim('')
    setManualText('')
    setNotes(null)
    setError(null)
  }

  const hasInput = Boolean(transcript.trim() || manualText.trim())

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <span className="font-serif text-lg font-semibold text-primary">Notable</span>
        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
            isListening ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}
          aria-live="polite"
        >
          <span className={`size-2 rounded-full ${isListening ? 'animate-pulse bg-primary-foreground' : 'bg-muted-foreground'}`} />
          {isListening ? 'Listening' : 'Idle'}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Mic className="size-3.5" aria-hidden="true" />
            Listen
          </p>
          {isSupported ? (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {isListening ? <Square className="size-3.5" aria-hidden="true" /> : <Mic className="size-3.5" aria-hidden="true" />}
              {isListening ? 'Stop' : 'Start listening'}
            </button>
          ) : null}
        </div>
        {isSupported ? (
          <div
            className="mt-2 max-h-28 min-h-16 overflow-y-auto rounded-lg bg-muted p-3 text-sm leading-relaxed"
            aria-label="Live transcript"
            aria-live="polite"
          >
            {transcript || interim ? (
              <p>
                {transcript} <span className="text-muted-foreground">{interim}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">Start listening, then have your computer read the chapter aloud.</p>
            )}
          </div>
        ) : (
          <p className="mt-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Listening isn&apos;t supported in this browser. Try Chrome or Edge, or use manual input below.
          </p>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor="manual-input" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <Keyboard className="size-3.5" aria-hidden="true" />
          Manual input
        </label>
        <textarea
          id="manual-input"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="Type or paste text from your textbook..."
          rows={4}
          maxLength={40000}
          className="mt-2 w-full resize-y rounded-lg border border-dashed border-primary/40 bg-background p-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={generateNotes}
          disabled={isGenerating || !hasInput}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          {isGenerating ? 'Creating notes...' : 'Create study notes'}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center justify-center rounded-md border border-border px-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          <span className="sr-only">Clear everything</span>
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {notes ? (
        <div className="mt-5 flex flex-col gap-3" aria-live="polite">
          <p className="font-serif text-base font-semibold">{notes.title}</p>
          <NoteGroup label="Key thoughts" items={notes.keyThoughts.map((t) => ({ text: t }))} />
          <NoteGroup label="Definitions" items={notes.definitions.map((d) => ({ term: d.term, text: d.definition }))} />
          <NoteGroup label="Concepts" items={notes.concepts.map((c) => ({ term: c.name, text: c.explanation }))} />
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-md border border-primary py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
            Export to Word
          </button>
        </div>
      ) : null}
    </div>
  )
}

function NoteGroup({ label, items }: { label: string; items: { term?: string; text: string }[] }) {
  if (items.length === 0) return null
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-sm leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>
            {item.term ? <span className="font-semibold">{item.term}: </span> : null}
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
