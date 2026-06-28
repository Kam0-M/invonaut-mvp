import OpenAI from 'openai'

// Lazy init — only created when AI is actually called, not at import time
// This prevents crashes when OPENAI_API_KEY is missing
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export const EXPENSE_CATEGORIES = [
  { value: 'software',      label: 'Software & Subscriptions' },
  { value: 'hardware',      label: 'Hardware & Equipment' },
  { value: 'travel',        label: 'Travel & Transport' },
  { value: 'meals',         label: 'Meals & Entertainment' },
  { value: 'marketing',     label: 'Marketing & Advertising' },
  { value: 'office',        label: 'Office Supplies' },
  { value: 'professional',  label: 'Professional Services' },
  { value: 'utilities',     label: 'Utilities & Internet' },
  { value: 'education',     label: 'Education & Training' },
  { value: 'insurance',     label: 'Insurance' },
  { value: 'taxes',         label: 'Taxes & Fees' },
  { value: 'other',         label: 'Other' },
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]['value']

export function getCategoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find(c => c.value === value)?.label ?? 'Other'
}

export async function suggestCategory(
  description: string,
  vendor?: string
): Promise<ExpenseCategory> {
  const categoryList = EXPENSE_CATEGORIES.map(c => `${c.value}: ${c.label}`).join('\n')

  const prompt = `You are an expense categorization assistant for freelancers and small businesses.

Given the following expense, return the single most appropriate category value.

Expense description: "${description}"
${vendor ? `Vendor: "${vendor}"` : ''}

Available categories:
${categoryList}

Respond ONLY with the category value (e.g. "software"). No explanation, no punctuation.`

  // Checklist #30: previously wrapped in try/catch that returned 'other' on ANY
  // error — including OpenAI being unreachable or uncredentialed — making a real
  // failure indistinguishable from the AI genuinely picking "other". Letting the
  // call fail loudly here lets the route handler return an honest failure state.
  // (The fallback to 'other' below stays — that's a *successful* call whose answer
  // just didn't match a known category value, a genuinely different case.)
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expense categorization assistant. Respond only with the category value string.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 20,
  })

  const raw = response.choices[0].message.content?.trim().toLowerCase() ?? 'other'
  const valid = EXPENSE_CATEGORIES.find(c => c.value === raw)
  return valid ? valid.value : 'other'
}