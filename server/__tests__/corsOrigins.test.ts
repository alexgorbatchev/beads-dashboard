import { describe, expect, it } from 'bun:test'

import { getAllowedCorsOrigins } from '../corsOrigins'

describe('getAllowedCorsOrigins', () => {
  it('uses CORS_ORIGINS when provided', () => {
    const allowedOrigins = getAllowedCorsOrigins({
      CORS_ORIGINS: 'http://devbox:5173, http://devbox:4173',
    })

    expect(Array.from(allowedOrigins)).toEqual(['http://devbox:5173', 'http://devbox:4173'])
  })

  it('falls back to CORS_ORIGIN and defaults when plural form is absent', () => {
    expect(
      Array.from(
        getAllowedCorsOrigins({
          CORS_ORIGIN: 'http://devbox:5173',
        })
      )
    ).toEqual(['http://devbox:5173'])

    expect(Array.from(getAllowedCorsOrigins({}))).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ])
  })
})
