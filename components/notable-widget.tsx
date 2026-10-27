'use client'

import { useEffect, useRef, useState } from 'react'
import type { ClipboardEvent, DragEvent } from 'react'
import { FileText, ImagePlus, Keyboard, Loader2, Mic, Sparkles, Square, Trash2, X } from 'lucide-react'
import type { StudyNotes } from '@/lib/notes'
import { exportNotesToWord } from '@/lib/export-docx'
import { extractNotesLocally } from '@/lib/local-notes'
import { getImageFiles, MAX_IMAGES, prepareImage, type AttachedImage } from '@/lib/images'

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
  const [images, setImages] = useState<AttachedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
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

  async function addImages(files: File[]) {
    if (files.length === 0) return
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      setError(`You can attach up to ${MAX_IMAGES} images.`)
      return
    }
    setError(files.length > room ? `Only the first ${room} image(s) were added (limit ${MAX_IMAGES}).` : null)
    try {
      const prepared = await Promise.all(files.slice(0, room).map(prepareImage))
      setImages((prev) => [...prev, ...prepared].slice(0, MAX_IMAGES))
    } catch {
      setError('One of those images could not be read. Try a PNG or JPG.')
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const files = getImageFiles(e.clipboardData.items)
    if (files.length === 0) return
    // Keep any pasted text; only block the default when the clipboard is image-only.
    if (!e.clipboardData.getData('text/plain')) e.preventDefault()
    void addImages(files)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    setIsDragging(false)
    const files = getImageFiles(e.dataTransfer.files)
    if (files.length === 0) return
    e.preventDefault()
    void addImages(files)
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  async function generateNotes() {
    const text = [transcript, manualText].map((t) => t.trim()).filter(Boolean).join('\n\n')
    if (!text && images.length === 0) {
      setError('Listen to a chapter or add manual input first.')
      return
    }

    setError(null)
    setIsGenerating(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, images: images.map((img) => img.dataUrl) }),
      })
      if (!res.ok) throw new Error('AI unavailable')
      setNotes((await res.json()) as StudyNotes)
    } catch {
      setNotes(extractNotesLocally(text))
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleExport() {
    if (!notes) return
    setIsExporting(true)
    try {
      await exportNotesToWord(notes, images)
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
    setImages([])
    setNotes(null)
    setError(null)
  }

  const hasInput = Boolean(transcript.trim() || manualText.trim() || images.length > 0)

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
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="manual-input" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Keyboard className="size-3.5" aria-hidden="true" />
            Manual input
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus className="size-3.5" aria-hidden="true" />
            Add image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              void addImages(getImageFiles(e.target.files))
              e.target.value = ''
            }}
          />
        </div>
        <div
          onDragOver={(e) => {
            if (Array.from(e.dataTransfer.types).includes('Files')) {
              e.preventDefault()
              setIsDragging(true)
            }
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-2 rounded-lg border border-dashed bg-background transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
            isDragging ? 'border-primary bg-primary/5' : 'border-primary/40'
          }`}
        >
          <textarea
            id="manual-input"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onPaste={handlePaste}
            placeholder="Type or paste text, graphs, or figures from your textbook..."
            rows={4}
            maxLength={40000}
            aria-describedby="manual-input-hint"
            className="block w-full resize-y rounded-lg bg-transparent p-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />
          {images.length > 0 ? (
            <ul className="flex flex-wrap gap-2 border-t border-dashed border-primary/30 p-3" aria-label="Attached images">
              {images.map((img, i) => (
                <li key={img.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                  <img
                    src={img.dataUrl}
                    alt={`Attached image ${i + 1}`}
                    className="size-20 rounded-md border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm hover:opacity-90"
                  >
                    <X className="size-3" aria-hidden="true" />
                    <span className="sr-only">Remove image {i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p id="manual-input-hint" className="mt-1.5 text-xs text-muted-foreground">
          Paste, drop, or add up to {MAX_IMAGES} images like graphs and diagrams.
        </p>
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
          {images.length > 0 ? (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Figures</p>
              <ul className="mt-2 flex flex-col gap-3">
                {images.map((img, i) => {
                  const figure = notes.figures?.[i]
                  return (
                    <li key={img.id} className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                      <img
                        src={img.dataUrl}
                        alt={figure?.title ?? `Figure ${i + 1}`}
                        className="size-16 shrink-0 rounded-md border border-border bg-background object-contain"
                      />
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold">{figure?.title ? `Figure ${i + 1}: ${figure.title}` : `Figure ${i + 1}`}</span>
                        {figure?.explanation ? <span className="block text-muted-foreground">{figure.explanation}</span> : null}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
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
