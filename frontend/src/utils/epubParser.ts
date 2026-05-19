import JSZip from 'jszip'
import type { BookMeta, Chapter } from '../types'

function generateId(title: string, author: string): string {
  return btoa(`${title}::${author}`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)
}

function parseXml(xmlStr: string): Document {
  return new DOMParser().parseFromString(xmlStr, 'application/xml')
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  // Remove script/style nodes
  doc.querySelectorAll('script, style, head').forEach(el => el.remove())
  return doc.body?.innerText ?? doc.body?.textContent ?? ''
}

function textToWords(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 0)
}

export async function parseEpub(file: File): Promise<BookMeta> {
  const zip = await JSZip.loadAsync(file)

  // 1. Read container.xml to find OPF path
  const containerXml = await zip.file('META-INF/container.xml')?.async('string')
  if (!containerXml) throw new Error('Invalid ePub: missing container.xml')

  const containerDoc = parseXml(containerXml)
  const rootfilePath = containerDoc
    .querySelector('rootfile')
    ?.getAttribute('full-path')
  if (!rootfilePath) throw new Error('Invalid ePub: no rootfile path')

  // 2. Read OPF
  const opfXml = await zip.file(rootfilePath)?.async('string')
  if (!opfXml) throw new Error('Invalid ePub: missing OPF file')

  const opfDoc = parseXml(opfXml)
  const opfDir = rootfilePath.includes('/') ? rootfilePath.replace(/\/[^/]+$/, '') : ''

  // 3. Metadata
  const title =
    opfDoc.querySelector('metadata > *|title, metadata > title')?.textContent?.trim() ??
    file.name.replace('.epub', '')
  const author =
    opfDoc.querySelector('metadata > *|creator, metadata > creator')?.textContent?.trim() ??
    'Unknown Author'

  // 4. Build manifest map: id -> href
  const manifest: Record<string, string> = {}
  opfDoc.querySelectorAll('manifest > item').forEach(item => {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    if (id && href) manifest[id] = href
  })

  // 5. Spine order
  const spineIds: string[] = []
  opfDoc.querySelectorAll('spine > itemref').forEach(ref => {
    const idref = ref.getAttribute('idref')
    if (idref) spineIds.push(idref)
  })

  if (spineIds.length === 0) throw new Error('Invalid ePub: empty spine')

  // 6. Extract chapters
  const chapters: Chapter[] = []
  let chapterNum = 0

  for (const spineId of spineIds) {
    const href = manifest[spineId]
    if (!href) continue

    const filePath = opfDir ? `${opfDir}/${href}` : href
    const htmlContent = await zip.file(filePath)?.async('string')
    if (!htmlContent) continue

    const htmlDoc = new DOMParser().parseFromString(htmlContent, 'text/html')

    // Skip nav/toc files
    const bodyText = htmlDoc.body?.textContent?.trim() ?? ''
    if (bodyText.length < 100) continue

    // Try to extract title from heading or use chapter number
    const heading =
      htmlDoc.querySelector('h1, h2, h3')?.textContent?.trim() ??
      `Chapter ${++chapterNum}`

    const rawText = stripHtml(htmlContent)
    const words = textToWords(rawText)

    if (words.length < 20) continue

    chapters.push({
      id: `ch-${spineId}`,
      title: heading,
      words,
      rawText,
    })
  }

  if (chapters.length === 0) throw new Error('No readable chapters found in ePub')

  return {
    id: generateId(title, author),
    title,
    author,
    chapters,
  }
}
