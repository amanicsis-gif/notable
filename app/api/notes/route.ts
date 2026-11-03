import { generateText, Output } from 'ai'
import { z } from 'zod'
import { notesSchema } from '@/lib/notes'

export const maxDuration = 60

const MAX_INPUT_LENGTH = 40000
const MAX_IMAGES = 4
const MAX_IMAGE_DATA_URL_LENGTH = 6_000_000
const JPEG_DATA_URL_PREFIX = 'data:image/jpeg;base64,'

const requestSchema = z
  .object({
    text: z.string().trim().max(MAX_INPUT_LENGTH).default(''),
    images: z
      .array(z.string().startsWith(JPEG_DATA_URL_PREFIX).max(MAX_IMAGE_DATA_URL_LENGTH))
      .max(MAX_IMAGES)
      .default([]),
  })
  .refine((data) => data.text.length >= 20 || data.images.length > 0, {
    message: 'Add a bit more text or an image before generating notes.',
  })

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 })
  }

  const { text, images } = parsed.data

  try {
    const { output } = await generateText({
      model: 'google/gemini-3-flash',
      output: Output.object({ schema: notesSchema }),
      system:
        'You are Notable, a study assistant. Turn textbook passages, graphs, and figures into concise, accurate study notes. ' +
        'Only use information present in the provided text and images. Do not invent facts. ' +
        'Key thoughts are a small number of the most important main ideas, summarized in your own words. Do not turn every sentence into a key thought. ' +
        'Definitions: ONLY include a term when the material itself states what it means (e.g. "X is defined as...", "X refers to...", "X, usually referred to as Y", "X is one of..."). ' +
        'Use the definition as given in the material. Never define a term the material does not define, and leave the list empty if nothing is defined. ' +
        'Concepts are the larger ideas or questions the material explains (such as section headings like "Why is X important?"), each with a short explanation drawn from the text. ' +
        'Ignore textual descriptions of graphs (axis ranges, plotted points) and source citations when writing key thoughts. ' +
        'For each attached image, add a figure entry (in order) explaining what it shows and how it relates to the text.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Create study notes from this material.${images.length ? ` ${images.length} image(s) attached.` : ''}\n\n${text}`,
            },
            ...images.map((dataUrl) => ({
              type: 'file' as const,
              mediaType: 'image/jpeg',
              data: dataUrl.slice(JPEG_DATA_URL_PREFIX.length),
            })),
          ],
        },
      ],
    })

    return Response.json(output)
  } catch (error) {
    console.error('[notable] note generation failed', error)
    return Response.json({ error: 'Could not generate notes. Please try again.' }, { status: 500 })
  }
}
