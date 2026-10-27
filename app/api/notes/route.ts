import { generateText, Output } from 'ai'
import { z } from 'zod'
import { notesSchema } from '@/lib/notes'

export const maxDuration = 60

const MAX_INPUT_LENGTH = 40000

const requestSchema = z.object({
  text: z.string().trim().min(20, 'Add a bit more text before generating notes.').max(MAX_INPUT_LENGTH),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 })
  }

  try {
    const { output } = await generateText({
      model: 'google/gemini-3-flash',
      output: Output.object({ schema: notesSchema }),
      system:
        'You are Notable, a study assistant. Turn textbook passages into concise, accurate study notes. ' +
        'Only use information present in the provided text. Do not invent facts. ' +
        'Key thoughts are the main ideas or arguments. Definitions are terms explicitly or implicitly defined in the text. ' +
        'Concepts are important ideas, processes, or principles worth remembering, each with a short explanation.',
      prompt: `Create study notes from this text:\n\n${parsed.data.text}`,
    })

    return Response.json(output)
  } catch (error) {
    console.error('[notable] note generation failed', error)
    return Response.json({ error: 'Could not generate notes. Please try again.' }, { status: 500 })
  }
}
