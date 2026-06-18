import { describe, expect, it } from 'vitest'
import { openDatabase } from '../src/main/db/database'
import { recordUnmatched, listUnmatched, clearUnmatched } from '../src/main/db/unmatched'

describe('unmatched windows', () => {
  it('upserts on (app, title), bumping count and last-seen', () => {
    const db = openDatabase(':memory:')
    recordUnmatched(db, 'Notion', 'Roadmap', 1000)
    recordUnmatched(db, 'Notion', 'Roadmap', 2000)
    const rows = listUnmatched(db)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ app: 'Notion', title: 'Roadmap', seenCount: 2, lastSeen: 2000 })
  })

  it('lists most-recent first', () => {
    const db = openDatabase(':memory:')
    recordUnmatched(db, 'A', 'one', 1000)
    recordUnmatched(db, 'B', 'two', 3000)
    recordUnmatched(db, 'C', 'three', 2000)
    expect(listUnmatched(db).map((r) => r.app)).toEqual(['B', 'C', 'A'])
  })

  it('clears one observation or all of them', () => {
    const db = openDatabase(':memory:')
    recordUnmatched(db, 'A', 'one', 1000)
    recordUnmatched(db, 'B', 'two', 2000)
    clearUnmatched(db, 'A', 'one')
    expect(listUnmatched(db).map((r) => r.app)).toEqual(['B'])
    clearUnmatched(db)
    expect(listUnmatched(db)).toHaveLength(0)
  })

  it('ignores a fully-empty observation', () => {
    const db = openDatabase(':memory:')
    recordUnmatched(db, '', '', 1000)
    expect(listUnmatched(db)).toHaveLength(0)
  })
})
