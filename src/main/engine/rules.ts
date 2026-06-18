import type { Rule, RuleField } from '../../shared/types'

export interface CompiledRule {
  ruleId: number
  projectCode: string
  regex: RegExp
  priority: number
  field: RuleField
}

/** The window signals a rule is tested against. */
export interface WindowSignals {
  title: string
  appName: string
}

/** A successful match: which project, via which rule and signal. */
export interface RuleMatch {
  projectCode: string
  ruleId: number
  field: RuleField
}

export function compileRules(rules: Rule[]): CompiledRule[] {
  const compiled: CompiledRule[] = []
  for (const r of rules) {
    try {
      compiled.push({
        ruleId: r.id,
        projectCode: r.projectCode,
        regex: new RegExp(r.pattern, 'i'),
        priority: r.priority,
        field: r.field ?? 'title'
      })
    } catch {
      // A bad user pattern must never take the tracker down; skip it.
    }
  }
  return compiled
}

/** The text a rule with the given field is tested against. */
function haystack(field: RuleField, w: WindowSignals): string {
  if (field === 'app') return w.appName
  if (field === 'any') return `${w.appName} ${w.title}`.trim()
  return w.title
}

/**
 * First match wins (callers pass rules already ordered by priority). Returns the
 * matched project + the rule/signal that fired it, or null.
 */
export function matchWindow(compiled: CompiledRule[], w: WindowSignals): RuleMatch | null {
  for (const rule of compiled) {
    const text = haystack(rule.field, w)
    if (text && rule.regex.test(text)) {
      return { projectCode: rule.projectCode, ruleId: rule.ruleId, field: rule.field }
    }
  }
  return null
}

/** Convenience: just the project code matched by a title (back-compat / tests). */
export function matchTitle(compiled: CompiledRule[], title: string): string | null {
  return matchWindow(compiled, { title, appName: '' })?.projectCode ?? null
}
