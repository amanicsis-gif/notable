import type { StudyNotes } from './notes'

export async function exportNotesToWord(notes: StudyNotes) {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx')

  const heading = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240 } })
  const bullet = (children: InstanceType<typeof TextRun>[]) => new Paragraph({ children, bullet: { level: 0 } })

  const children = [new Paragraph({ text: notes.title || 'Study Notes', heading: HeadingLevel.TITLE })]

  if (notes.keyThoughts.length > 0) {
    children.push(heading('Key thoughts'))
    notes.keyThoughts.forEach((thought) => children.push(bullet([new TextRun(thought)])))
  }

  if (notes.definitions.length > 0) {
    children.push(heading('Definitions'))
    notes.definitions.forEach(({ term, definition }) =>
      children.push(bullet([new TextRun({ text: `${term}: `, bold: true }), new TextRun(definition)])),
    )
  }

  if (notes.concepts.length > 0) {
    children.push(heading('Concepts'))
    notes.concepts.forEach(({ name, explanation }) =>
      children.push(bullet([new TextRun({ text: `${name}: `, bold: true }), new TextRun(explanation)])),
    )
  }

  const doc = new Document({ creator: 'Notable', title: notes.title, sections: [{ children }] })
  const blob = await Packer.toBlob(doc)

  const fileName = `${(notes.title || 'study-notes').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'study-notes'}.docx`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
