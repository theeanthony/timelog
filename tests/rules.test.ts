import { describe, expect, it } from 'vitest'
import { compileRules, matchTitle, matchWindow } from '../src/main/engine/rules'
import { defaultPatternFor } from '../src/main/db/projects'
import type { Rule, RuleField } from '../src/shared/types'

const rule = (
  projectCode: string,
  pattern: string,
  priority = 0,
  field: RuleField = 'title'
): Rule => ({
  id: 0,
  projectCode,
  pattern,
  priority,
  enabled: true,
  field
})

describe('rule matching (title)', () => {
  it('matches case-insensitively', () => {
    const compiled = compileRules([rule('P-100', 'p-100')])
    expect(matchTitle(compiled, 'Drawing P-100 Rev C — AutoCAD')).toBe('P-100')
  })

  it('returns null for empty titles and no matches', () => {
    const compiled = compileRules([rule('P-100', 'P-100')])
    expect(matchTitle(compiled, '')).toBeNull()
    expect(matchTitle(compiled, 'Inbox — Outlook')).toBeNull()
  })

  it('first rule in the provided order wins', () => {
    const compiled = compileRules([rule('HIGH', 'shared', 10), rule('LOW', 'shared', 0)])
    expect(matchTitle(compiled, 'shared filename.dwg')).toBe('HIGH')
  })

  it('skips invalid regex patterns without throwing', () => {
    const compiled = compileRules([rule('BAD', '([unclosed'), rule('P-100', 'P-100')])
    expect(compiled).toHaveLength(1)
    expect(matchTitle(compiled, 'P-100 plan')).toBe('P-100')
  })

  it('default pattern matches code or label with regex chars escaped', () => {
    const pattern = defaultPatternFor({ code: 'P-100 (East)', label: 'Sub C++' })
    const compiled = compileRules([rule('P-100 (East)', pattern)])
    expect(matchTitle(compiled, 'P-100 (East) layout.dwg')).toBe('P-100 (East)')
    expect(matchTitle(compiled, 'notes about Sub C++ rev 2')).toBe('P-100 (East)')
    expect(matchTitle(compiled, 'P-100 East layout.dwg')).toBeNull()
  })
})

describe('matchWindow (app / title / any fields)', () => {
  const win = (title: string, appName: string): { title: string; appName: string } => ({
    title,
    appName
  })

  it('an app-field rule matches the app name, not the title', () => {
    const compiled = compileRules([rule('DESIGN', 'Figma', 1, 'app')])
    expect(matchWindow(compiled, win('Untitled — Figma', 'Figma'))?.projectCode).toBe('DESIGN')
    // Same pattern but the app name is absent → no match (title isn't consulted).
    expect(matchWindow(compiled, win('Figma tutorial — Chrome', 'Chrome'))).toBeNull()
  })

  it('a title-field rule ignores the app name', () => {
    const compiled = compileRules([rule('P-100', 'P-100', 0, 'title')])
    expect(matchWindow(compiled, win('random', 'P-100 Tool'))).toBeNull()
    expect(matchWindow(compiled, win('P-100 layout', 'AutoCAD'))?.projectCode).toBe('P-100')
  })

  it("an 'any'-field rule matches either app or title", () => {
    const compiled = compileRules([rule('COMMS', 'slack', 0, 'any')])
    expect(matchWindow(compiled, win('general', 'Slack'))?.projectCode).toBe('COMMS')
    expect(matchWindow(compiled, win('Slack export.csv', 'Excel'))?.projectCode).toBe('COMMS')
  })

  it('returns the rule id and field that fired', () => {
    const compiled = compileRules([{ ...rule('DESIGN', 'Figma', 1, 'app'), id: 42 }])
    const m = matchWindow(compiled, win('Untitled', 'Figma'))
    expect(m).toEqual({ projectCode: 'DESIGN', ruleId: 42, field: 'app' })
  })
})
