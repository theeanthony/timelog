import { describe, expect, it } from 'vitest'
import { compileRules, matchTitle } from '../src/main/engine/rules'
import { defaultPatternFor } from '../src/main/db/projects'
import type { Rule } from '../src/shared/types'

const rule = (projectCode: string, pattern: string, priority = 0): Rule => ({
  id: 0,
  projectCode,
  pattern,
  priority,
  enabled: true
})

describe('rule matching', () => {
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
