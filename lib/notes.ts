import { z } from 'zod'

export const notesSchema = z.object({
  title: z.string().describe('A short title for these study notes, based on the text.'),
  keyThoughts: z.array(z.string()).describe('Main ideas from the text, one sentence each.'),
  definitions: z.array(z.object({ term: z.string(), definition: z.string() })),
  concepts: z.array(z.object({ name: z.string(), explanation: z.string() })),
})

export type StudyNotes = z.infer<typeof notesSchema>
