// Mailchimp-style merge tags: `{{FIRST_NAME}}` (optional inner spaces).
// Unknown/empty variables render as empty string — never leak the raw tag.

const TAG_RE = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type TemplateVars = Record<string, string | null | undefined>

// For HTML bodies — values are escaped so lead-provided data can't inject markup.
export function renderHtml(template: string, vars: TemplateVars): string {
  return template.replace(TAG_RE, (_, key: string) => escapeHtml(vars[key] ?? ''))
}

// For subjects (plain text) — no escaping.
export function renderText(template: string, vars: TemplateVars): string {
  return template.replace(TAG_RE, (_, key: string) => vars[key] ?? '')
}
