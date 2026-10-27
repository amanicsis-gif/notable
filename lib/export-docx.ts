import type { StudyNotes } from './notes'
import type { AttachedImage } from './images'

const MAX_IMAGE_WIDTH = 560

export async function exportNotesToWord(notes: StudyNotes, images: AttachedImage[] = []) {
  const { Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } = await import('docx')

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

  if (images.length > 0) {
    children.push(heading('Figures'))
    images.forEach((image, i) => {
      const figure = notes.figures[i]
      const scale = Math.min(1, MAX_IMAGE_WIDTH / image.width)
      children.push(
        new Paragraph({
          spacing: { before: 160 },
          children: [
            new ImageRun({
              type: 'jpg',
              data: image.dataUrl,
              transformation: { width: Math.round(image.width * scale), height: Math.round(image.height * scale) },
              altText: { name: figure?.title ?? `Figure ${i + 1}`, description: figure?.explanation ?? '', title: figure?.title ?? '' },
            }),
          ],
        }),
      )
      children.push(
        new Paragraph({
          children: [new TextRun({ text: figure?.title ? `Figure ${i + 1}: ${figure.title}` : `Figure ${i + 1}`, bold: true })],
        }),
      )
      if (figure?.explanation) children.push(new Paragraph({ children: [new TextRun(figure.explanation)] }))
    })
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
