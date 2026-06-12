import type { Rule } from '../../shared/types'

export interface CompiledRule {
  projectCode: string
  regex: RegExp
  priority: number
}

export function compileRules(rules: Rule[]): CompiledRule[] {
  const compiled: CompiledRule[] = []
  for (const r of rules) {
    try {
      compiled.push({
        projectCode: r.projectCode,
        regex: new RegExp(r.pattern, 'i'),
        priority: r.priority
      })
    } catch {
      // A bad user pattern must never take the tracker down; skip it.
    }
  }
  return compiled
}

/** First match wins; callers pass rules already ordered by priority. */
export function matchTitle(compiled: CompiledRule[], title: string): string | null {
  if (!title) return null
  for (const rule of compiled) {
    if (rule.regex.test(title)) return rule.projectCode
  }
  return null
}
