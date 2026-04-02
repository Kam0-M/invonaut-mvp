import OpenAI from 'openai'

// Lazy init — only created when AI is actually called, not at import time.
// CRITICAL: Never initialize at module top level — crashes entire page when OPENAI_API_KEY is missing.
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export type ReviewIssue = {
  severity: 'high' | 'medium' | 'low'
  title: string
  explanation: string
}

export type ReviewResult = {
  issues: ReviewIssue[]
  summary: string
  overallRisk: 'high' | 'medium' | 'low'
}

export async function reviewContract(
  contractTitle: string,
  clauses: { title: string; content: string }[]
): Promise<ReviewResult> {
  const clauseText = clauses
    .map((c, i) => `${i + 1}. ${c.title}\n${c.content}`)
    .join('\n\n')

  const prompt = `You are a contract review assistant for freelancers and small business owners.

Review the following contract and identify any missing or weak protections. Focus on practical risks that could hurt the service provider.

Contract: "${contractTitle}"

Clauses:
${clauseText}

Check for these common issues (but don't limit yourself to them):
- Missing or weak IP / ownership clause
- No liability cap or limitation of liability
- No governing law / jurisdiction specified
- No kill fee or cancellation terms
- No revision limit clause
- No late payment penalty
- Vague payment terms (no due dates or amounts)
- No confidentiality / NDA clause where appropriate
- No dispute resolution process
- Overly one-sided indemnification
- No force majeure clause

Respond ONLY with a valid JSON object in this exact shape:
{
  "overallRisk": "high" | "medium" | "low",
  "summary": "One sentence summary of the contract's overall protective strength.",
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "title": "Short issue title",
      "explanation": "One to two sentences explaining the risk and what should be added."
    }
  ]
}

If the contract is well-protected with no significant issues, return an empty issues array and overallRisk of "low".
Order issues by severity (high first). Maximum 8 issues.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a contract review assistant. You respond only with valid JSON. No markdown, no explanation outside the JSON object.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  })

  const raw = response.choices[0].message.content || '{}'
  const parsed = JSON.parse(raw)

  return {
    overallRisk: parsed.overallRisk ?? 'medium',
    summary: parsed.summary ?? 'Review complete.',
    issues: (parsed.issues ?? []) as ReviewIssue[],
  }
}