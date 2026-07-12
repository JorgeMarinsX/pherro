// Canonical transactional template catalog. DB rows hold the editable
// subject/html; key, variables and samples live here (not editable).

export interface EmailVariable {
  key: string
  label: string
  sample: string
}

export interface DefaultTemplate {
  key: string
  name: string
  description: string
  subject: string
  html: string
  variables: EmailVariable[]
}

const BASE_STYLE = 'margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#27272a;'

function shell(inner: string): string {
  return `<div style="${BASE_STYLE}padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    ${inner}
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0 16px;">
    <p style="font-size:12px;color:#a1a1aa;margin:0;">Enviado por {{SHOP_NAME}} via Pherro.</p>
  </div>
</div>`
}

export const TEMPLATE_KEYS = [
  'welcome',
  'password_recovery',
  'new_lead',
  'payment_overdue',
  'account_suspended',
  'account_reactivated',
] as const
export type TemplateKey = (typeof TEMPLATE_KEYS)[number]

export const DEFAULT_TEMPLATES: readonly DefaultTemplate[] = [
  {
    key: 'welcome',
    name: 'Boas-vindas',
    description: 'Enviado ao administrador quando uma nova loja é criada.',
    subject: 'Bem-vindo à Pherro, {{SHOP_NAME}}!',
    html: shell(`<h1 style="font-size:22px;margin:0 0 16px;color:#8B1A1A;">Bem-vindo à Pherro!</h1>
    <p style="font-size:15px;line-height:1.6;">Olá, <strong>{{FIRST_NAME}}</strong>!</p>
    <p style="font-size:15px;line-height:1.6;">Sua loja <strong>{{SHOP_NAME}}</strong> foi criada com sucesso. Acesse o painel para cadastrar seus veículos e começar a receber leads.</p>
    <p style="margin:24px 0;">
      <a href="{{LOGIN_URL}}" style="background:#8B1A1A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;display:inline-block;">Acessar painel</a>
    </p>
    <p style="font-size:13px;color:#71717a;line-height:1.6;">Seu login: {{EMAIL}}</p>`),
    variables: [
      { key: 'FIRST_NAME', label: 'Nome', sample: 'João' },
      { key: 'SHOP_NAME', label: 'Nome da loja', sample: 'Auto Center Silva' },
      { key: 'EMAIL', label: 'E-mail de login', sample: 'joao@lojasilva.com.br' },
      { key: 'LOGIN_URL', label: 'Link do painel', sample: 'https://minhaloja.pherro.app/admin' },
    ],
  },
  {
    key: 'password_recovery',
    name: 'Recuperação de senha',
    description: 'Enviado quando um usuário solicita redefinição de senha.',
    subject: 'Redefinição de senha — {{SHOP_NAME}}',
    html: shell(`<h1 style="font-size:22px;margin:0 0 16px;color:#8B1A1A;">Redefinição de senha</h1>
    <p style="font-size:15px;line-height:1.6;">Olá, <strong>{{FIRST_NAME}}</strong>!</p>
    <p style="font-size:15px;line-height:1.6;">Recebemos um pedido para redefinir a senha da sua conta em <strong>{{SHOP_NAME}}</strong>. Clique no botão abaixo para criar uma nova senha:</p>
    <p style="margin:24px 0;">
      <a href="{{RESET_LINK}}" style="background:#8B1A1A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;display:inline-block;">Redefinir senha</a>
    </p>
    <p style="font-size:13px;color:#71717a;line-height:1.6;">Se você não pediu essa redefinição, ignore este e-mail — sua senha continua a mesma.</p>`),
    variables: [
      { key: 'FIRST_NAME', label: 'Nome', sample: 'João' },
      { key: 'SHOP_NAME', label: 'Nome da loja', sample: 'Auto Center Silva' },
      { key: 'RESET_LINK', label: 'Link de redefinição', sample: 'https://minhaloja.pherro.app/admin/redefinir-senha?token=abc123' },
    ],
  },
  {
    key: 'new_lead',
    name: 'Novo lead',
    description: 'Notifica o administrador da loja quando um prospect preenche o formulário.',
    subject: 'Novo lead: {{LEAD_NAME}} — {{SHOP_NAME}}',
    html: shell(`<h1 style="font-size:22px;margin:0 0 16px;color:#8B1A1A;">Você recebeu um novo lead!</h1>
    <p style="font-size:15px;line-height:1.6;">Um prospect acabou de deixar os dados na sua loja <strong>{{SHOP_NAME}}</strong>:</p>
    <table style="width:100%;font-size:15px;line-height:1.8;border-collapse:collapse;margin:16px 0;">
      <tr><td style="color:#71717a;width:120px;">Nome</td><td><strong>{{LEAD_NAME}}</strong></td></tr>
      <tr><td style="color:#71717a;">Telefone</td><td>{{LEAD_PHONE}}</td></tr>
      <tr><td style="color:#71717a;">E-mail</td><td>{{LEAD_EMAIL}}</td></tr>
      <tr><td style="color:#71717a;">Interesse</td><td>{{VEHICLE}}</td></tr>
    </table>
    <p style="margin:24px 0;">
      <a href="{{ADMIN_URL}}" style="background:#8B1A1A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;display:inline-block;">Ver no painel</a>
    </p>`),
    variables: [
      { key: 'SHOP_NAME', label: 'Nome da loja', sample: 'Auto Center Silva' },
      { key: 'LEAD_NAME', label: 'Nome do lead', sample: 'Maria Souza' },
      { key: 'LEAD_PHONE', label: 'Telefone do lead', sample: '(11) 98765-4321' },
      { key: 'LEAD_EMAIL', label: 'E-mail do lead', sample: 'maria@email.com' },
      { key: 'VEHICLE', label: 'Veículo de interesse', sample: 'Fiat Argo 2022' },
      { key: 'ADMIN_URL', label: 'Link do painel de leads', sample: 'https://minhaloja.pherro.app/admin/leads' },
    ],
  },
  {
    key: 'payment_overdue',
    name: 'Pagamento em atraso',
    description: 'Enviado ao administrador quando a mensalidade fica em atraso (início do período de carência).',
    subject: 'Pagamento em atraso — {{SHOP_NAME}}',
    html: shell(`<h1 style="font-size:22px;margin:0 0 16px;color:#8B1A1A;">Pagamento em atraso</h1>
    <p style="font-size:15px;line-height:1.6;">Olá!</p>
    <p style="font-size:15px;line-height:1.6;">Não identificamos o pagamento da mensalidade da sua loja <strong>{{SHOP_NAME}}</strong>. Para evitar a suspensão, regularize o pagamento até <strong>{{GRACE_DEADLINE}}</strong>.</p>
    <p style="font-size:15px;line-height:1.6;">Após essa data, sua loja e o painel administrativo serão suspensos até a confirmação do pagamento.</p>
    <p style="margin:24px 0;">
      <a href="{{PAY_URL}}" style="background:#8B1A1A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;display:inline-block;">Pagar agora</a>
    </p>
    <p style="font-size:13px;color:#71717a;line-height:1.6;">Se você já pagou, desconsidere este e-mail — a confirmação pode levar algumas horas.</p>`),
    variables: [
      { key: 'SHOP_NAME', label: 'Nome da loja', sample: 'Auto Center Silva' },
      { key: 'GRACE_DEADLINE', label: 'Data-limite para pagamento', sample: '19/07/2026' },
      { key: 'PAY_URL', label: 'Link de pagamento', sample: 'https://www.asaas.com/i/abc123' },
    ],
  },
  {
    key: 'account_suspended',
    name: 'Loja suspensa',
    description: 'Enviado quando a loja é suspensa por falta de pagamento após o período de carência.',
    subject: 'Sua loja foi suspensa — {{SHOP_NAME}}',
    html: shell(`<h1 style="font-size:22px;margin:0 0 16px;color:#8B1A1A;">Loja suspensa</h1>
    <p style="font-size:15px;line-height:1.6;">Olá!</p>
    <p style="font-size:15px;line-height:1.6;">Sua loja <strong>{{SHOP_NAME}}</strong> foi suspensa por falta de pagamento. O site e o painel administrativo ficam indisponíveis até a confirmação.</p>
    <p style="font-size:15px;line-height:1.6;">Assim que o pagamento for confirmado, tudo volta ao ar automaticamente — seus veículos, leads e configurações continuam salvos.</p>
    <p style="margin:24px 0;">
      <a href="{{PAY_URL}}" style="background:#8B1A1A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;display:inline-block;">Regularizar pagamento</a>
    </p>`),
    variables: [
      { key: 'SHOP_NAME', label: 'Nome da loja', sample: 'Auto Center Silva' },
      { key: 'PAY_URL', label: 'Link de pagamento', sample: 'https://www.asaas.com/i/abc123' },
    ],
  },
  {
    key: 'account_reactivated',
    name: 'Loja reativada',
    description: 'Enviado quando o pagamento é confirmado e a loja suspensa volta ao ar.',
    subject: 'Sua loja está no ar novamente — {{SHOP_NAME}}',
    html: shell(`<h1 style="font-size:22px;margin:0 0 16px;color:#8B1A1A;">Pagamento confirmado!</h1>
    <p style="font-size:15px;line-height:1.6;">Olá!</p>
    <p style="font-size:15px;line-height:1.6;">Recebemos o pagamento e sua loja <strong>{{SHOP_NAME}}</strong> já está no ar novamente, com todos os veículos, leads e configurações intactos.</p>
    <p style="margin:24px 0;">
      <a href="{{ADMIN_URL}}" style="background:#8B1A1A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;display:inline-block;">Acessar painel</a>
    </p>`),
    variables: [
      { key: 'SHOP_NAME', label: 'Nome da loja', sample: 'Auto Center Silva' },
      { key: 'ADMIN_URL', label: 'Link do painel', sample: 'https://minhaloja.pherro.app/admin' },
    ],
  },
]

// Merge tags available in marketing campaigns (per-lead).
export const CAMPAIGN_VARIABLES: readonly EmailVariable[] = [
  { key: 'FIRST_NAME', label: 'Primeiro nome', sample: 'Maria' },
  { key: 'NAME', label: 'Nome completo', sample: 'Maria Souza' },
  { key: 'EMAIL', label: 'E-mail', sample: 'maria@email.com' },
  { key: 'PHONE', label: 'Telefone', sample: '(11) 98765-4321' },
  { key: 'SHOP_NAME', label: 'Nome da loja', sample: 'Auto Center Silva' },
]

export const DEFAULT_CAMPAIGN_HTML = shell(`<h1 style="font-size:22px;margin:0 0 16px;color:#8B1A1A;">Olá, {{FIRST_NAME}}!</h1>
    <p style="font-size:15px;line-height:1.6;">Escreva aqui a mensagem da sua campanha. Use as variáveis para personalizar, por exemplo: {{FIRST_NAME}}, {{SHOP_NAME}}.</p>`)
