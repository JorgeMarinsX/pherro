import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Client-side leads/vehicles export (CSV + PDF). Data is fetched via the
// tenant-scoped /api/admin endpoints, so every export is isolated per tenant —
// this module only formats rows the caller already fetched.

// A column the user can pick to include in an export.
export interface ExportField<T> {
  key: string
  label: string // pt-BR header
  // Cell renderer → plain string. Defaults to String(row[key]).
  format?: (row: T) => string
}

// Tenant maroon primary (index.md §4). autoTable wants an RGB tuple.
const BRAND: [number, number, number] = [139, 26, 26] // #8B1A1A

function cell<T>(row: T, field: ExportField<T>): string {
  if (field.format) return field.format(row)
  const v = (row as Record<string, unknown>)[field.key]
  return v == null ? '' : String(v)
}

// Escape one CSV field per RFC 4180 (quote if it holds "," / '"' / newline).
function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// yyyy-mm-dd for filenames.
function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

export function exportCsv<T>(
  rows: T[],
  fields: ExportField<T>[],
  filenameBase: string,
) {
  const header = fields.map((f) => csvEscape(f.label)).join(',')
  const lines = rows.map((row) =>
    fields.map((f) => csvEscape(cell(row, f))).join(','),
  )
  // Prepend BOM so Excel opens UTF-8 (acentos) correctly.
  const csv = `﻿${[header, ...lines].join('\r\n')}`
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${filenameBase}-${dateStamp()}.csv`)
}

export interface PdfMeta {
  title: string // e.g. "Leads"
  shopName: string
  logoUrl?: string | null
}

export async function exportPdf<T>(
  rows: T[],
  fields: ExportField<T>[],
  filenameBase: string,
  meta: PdfMeta,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 40

  // --- Header band (brand maroon) ---
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageWidth, 64, 'F')

  const logo = await loadLogo(meta.logoUrl)
  let textX = marginX
  if (logo) {
    doc.addImage(logo.dataUrl, logo.format, marginX, 16, 32, 32)
    textX = marginX + 44
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(meta.shopName, textX, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(meta.title, textX, 48)

  // Generated-at, right-aligned in the band.
  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())
  doc.setFontSize(9)
  doc.text(`Gerado em ${generatedAt}`, pageWidth - marginX, 30, { align: 'right' })
  doc.text(`${rows.length} registro${rows.length === 1 ? '' : 's'}`, pageWidth - marginX, 46, {
    align: 'right',
  })

  // --- Table ---
  autoTable(doc, {
    startY: 84,
    margin: { left: marginX, right: marginX },
    head: [fields.map((f) => f.label)],
    body: rows.map((row) => fields.map((f) => cell(row, f))),
    styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 244, 244] },
    theme: 'striped',
    // Page-number footer.
    didDrawPage: (data) => {
      const page = doc.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(
        `Página ${data.pageNumber} de ${page}`,
        pageWidth - marginX,
        doc.internal.pageSize.getHeight() - 16,
        { align: 'right' },
      )
    },
  })

  doc.save(`${filenameBase}-${dateStamp()}.pdf`)
}

// Load the shop logo as a data URL for embedding. Best-effort — a failed/cross
// origin fetch just yields no logo, never blocks the export.
async function loadLogo(
  url?: string | null,
): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const format = blob.type.includes('png') ? 'PNG' : 'JPEG'
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return { dataUrl, format }
  } catch {
    return null
  }
}
