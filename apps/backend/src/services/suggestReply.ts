const DEFAULT_TEMPLATE =
  'Thanks for reaching out. We are looking into this and will update you shortly.';

const BY_CATEGORY: Record<string, string> = {
  Billing:
    'Thanks for the billing note. Please confirm the invoice or last-four of the payment method and we will review the charge.',
  Technical:
    'Thanks for the technical details. We are checking this against known issues and will reply with next steps.',
  Incident:
    'We have received this incident and are treating it as high priority. Please keep this thread for updates.',
  General:
    'Thanks for contacting support. We have your request and will follow up as soon as we have an answer.',
};

export function pickReplyTemplate(categoryName?: string | null): string {
  if (!categoryName) return DEFAULT_TEMPLATE;
  return BY_CATEGORY[categoryName] ?? DEFAULT_TEMPLATE;
}

export function articleSnippet(title: string, body: string, max = 400): string {
  const trimmed = body.replace(/\s+/g, ' ').trim();
  const excerpt = trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
  return `From Help Center — ${title}\n${excerpt}`;
}
