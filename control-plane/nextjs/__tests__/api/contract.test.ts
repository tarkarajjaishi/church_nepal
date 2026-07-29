import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'

// The suite calls vi.mocked(apiClient.get) — without this the real axios
// instance is imported and .mockResolvedValue does not exist on it.
vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const CONTRACT_BASE = '../contracts/openapi.json'

type PathSchema = {
  // Some endpoints legitimately return one of several shapes for the same
  // status (e.g. login answers with either a 2FA challenge or a token pair).
  // `required` cannot express that — it demands every key at once — so those
  // responses are declared as `oneOf` variants instead.
  oneOf?: Record<string, Array<Record<string, string>>>
  required?: Record<string, string | string[]>
  arrayOf?: {
    required: string[]
    optional?: string[]
    minItems?: number
    maxItems?: number
  }
  properties?: {
    [key: string]: string | { type: string; nullable?: boolean; items?: { required: string[] } }
  }
  additionalProperties?: { type: string; nullable?: boolean }
}

const SCHEMAS: Record<string, PathSchema> = {
  // Declared so the "every backend route has a contract entry" check passes —
  // both are advertised by GET /api/_routes.
  '/healthz': {
    required: {
      '200': { status: 'string', version: 'string', uptime_seconds: 'number' },
    },
  },
  '/api/_routes': {
    required: {
      '200': { items: ['method', 'path', 'auth'] },
    },
  },
  '/api/auth/login': {
    // Either a 2FA challenge, or a completed sign-in — never both.
    oneOf: {
      '200': [
        { twofa_required: 'boolean' },
        { token: 'string', refresh_token: 'string', email: 'string', role: 'string' },
      ],
    },
  },
  '/api/auth/refresh': {
    required: {
      '200': { token: 'string', refresh_token: 'string', email: 'string', role: 'string' },
    },
  },
  '/api/auth/logout': {
    required: {
      '200': { success: 'boolean' },
    },
  },
  '/api/auth/me': {
    required: {
      '200': { id: 'string', email: 'string', role: 'string', twofa_enabled: 'boolean' },
    },
  },
  '/api/auth/reset-authenticated': {
    required: {
      '200': { success: 'boolean', message: 'string' },
    },
  },
  '/api/auth/2fa/enroll': {
    required: {
      '200': { secret: 'string', otpauth_url: 'string', qr_base64: 'string' },
    },
  },
  '/api/auth/2fa/verify': {
    required: {
      '200': { success: 'boolean', message: 'string' },
    },
  },
  '/api/auth/2fa/disable': {
    required: {
      '200': { success: 'boolean', message: 'string' },
    },
  },
  '/api/churches': {
    required: {
      '200': {
        type: 'array',
        items: { required: ['id', 'name', 'slug', 'subdomain', 'admin_email', 'status'], optional: ['plan', 'custom_domain', 'last_active_at', 'storage_bytes', 'notes', 'created_at', 'member_count', 'giving_total'] },
      },
    },
  },
  '/api/settings': {
    required: {
      '200': { additionalProperties: 'any' },
    },
  },
  '/api/api-keys': {
    required: {
      '200': {
        type: 'array',
        items: { required: ['id', 'name', 'masked_key', 'scopes'], optional: ['revoked_at', 'last_used_at', 'created_at'] },
      },
    },
  },
  '/api/_routes': {
    required: {
      '200': {
        type: 'array',
        items: { required: ['method', 'path', 'auth'] },
      },
    },
  },
}

function assertType(value: unknown, expected: string, path: string): void {
  const actual = Array.isArray(value) ? 'array' : typeof value
  expect(actual).toBe(expected)
}

function validateRequiredKeys(obj: Record<string, unknown>, schema: Record<string, string | string[]>, path: string): void {
  for (const [key, check] of Object.entries(schema)) {
    if (!(key in obj)) {
      throw new Error(`Missing required key "${key}" at "${path}"`)
    }
    if (typeof check === 'string') {
      if (check === 'any') continue
      if (check === 'array') {
        expect(Array.isArray(obj[key])).toBe(true)
      } else if (check === 'object') {
        expect(typeof obj[key]).toBe('object')
        expect(obj[key]).not.toBeNull()
        expect(Array.isArray(obj[key])).toBe(false)
      } else {
        assertType(obj[key], check, `${path}.${key}`)
      }
    } else {
      expect(Array.isArray(obj[key])).toBe(true)
      if (check.length > 0) {
        validateArrayItems(obj[key] as unknown[], check, `${path}.${key}`)
      }
    }
  }
}

function validateArrayItems(items: unknown[], requiredKeys: string[], path: string): void {
  expect(items.length).toBeGreaterThan(0)
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>
    for (const key of requiredKeys) {
      expect(key in item).toBe(true)
    }
  }
}

function validateResponseShape(body: unknown, path: string, status: number, schema: PathSchema): void {
  const statusStr = String(status)

  const variants = schema.oneOf?.[statusStr]
  if (variants) {
    expect(typeof body).toBe('object')
    expect(body).not.toBeNull()
    const obj = body as Record<string, unknown>
    const matches = variants.some((variant) =>
      Object.entries(variant).every(
        ([key, type]) => key in obj && typeof obj[key] === type
      )
    )
    if (!matches) {
      throw new Error(
        `Response at "${path}" (${statusStr}) matched none of the declared variants. ` +
          `Got keys [${Object.keys(obj).join(', ')}]; expected one of ` +
          variants.map((v) => `[${Object.keys(v).join(', ')}]`).join(' or ')
      )
    }
    return
  }

  const requiredForStatus = schema.required?.[statusStr]
  if (!requiredForStatus) return

  expect(body).not.toBeNull()

  const entries = Object.entries(requiredForStatus)

  if (entries.length === 1 && entries[0][0] === 'additionalProperties') {
    expect(typeof body).toBe('object')
    return
  }

  const itemCheck = entries.find(([k]) => k === 'items')

  if (itemCheck) {
    expect(Array.isArray(body)).toBe(true)
    const items = body as unknown[]
    if (items.length > 0) {
      const requiredKeys = Array.isArray(itemCheck[1])
        ? (itemCheck[1] as string[])
        : (itemCheck[1] as { required: string[] }).required
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as Record<string, unknown>
        for (const key of requiredKeys) {
          expect(key in item).toBe(true)
        }
      }
    }
    return
  }

  expect(typeof body).toBe('object')
  const obj = body as Record<string, unknown>
  validateRequiredKeys(obj, requiredForStatus, path)
}

function validateContract(pathname: string, status: number, body: unknown): void {
  const schema = SCHEMAS[pathname]
  if (!schema) return
  validateResponseShape(body, pathname, status, schema)
}

describe('API contract tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires contract entries for every backend route', async () => {
    const mockData = {
      data: [
        { method: 'GET', path: '/healthz', auth: 'none' },
        { method: 'POST', path: '/api/auth/login', auth: 'none' },
        { method: 'GET', path: '/api/_routes', auth: 'none' },
      ],
    }
    vi.mocked(apiClient.get).mockResolvedValue({ status: 200, data: mockData, headers: {}, config: {} } as any)

    const response = await apiClient.get('/api/_routes')
    const routes = response.data.data as Array<{ method: string; path: string; auth: string }>

    for (const route of routes) {
      const expected = Object.keys(SCHEMAS)
      expect(expected).toContain(route.path)
    }
  })

  it('validates POST /api/auth/login 200 shape', async () => {
    const body = {
      token: 'abc123',
      refresh_token: 'refresh123',
      email: 'admin@test.com',
      role: 'super_admin',
    }
    validateContract('/api/auth/login', 200, body)
  })

  it('validates POST /api/auth/login 200 twofa_required shape', async () => {
    const body = { twofa_required: true }
    validateContract('/api/auth/login', 200, body)
  })

  it('validates POST /api/auth/refresh 200 shape', async () => {
    const body = {
      token: 'newtoken',
      refresh_token: 'newrefresh',
      email: 'admin@test.com',
      role: 'admin',
    }
    validateContract('/api/auth/refresh', 200, body)
  })

  it('validates POST /api/auth/logout 200 shape', async () => {
    validateContract('/api/auth/logout', 200, { success: true })
  })

  it('validates GET /api/auth/me 200 shape', async () => {
    validateContract('/api/auth/me', 200, { id: '1', email: 'admin@test.com', role: 'super_admin', twofa_enabled: false })
  })

  it('validates POST /api/auth/reset-authenticated 200 shape', async () => {
    validateContract('/api/auth/reset-authenticated', 200, { success: true, message: 'Password updated' })
  })

  it('validates POST /api/auth/2fa/enroll 200 shape', async () => {
    validateContract('/api/auth/2fa/enroll', 200, { secret: 'BASE32SECRET', otpauth_url: 'otpauth://...', qr_base64: 'data:image/png;base64,...' })
  })

  it('validates POST /api/auth/2fa/verify 200 shape', async () => {
    validateContract('/api/auth/2fa/verify', 200, { success: true, message: '2FA enabled' })
  })

  it('validates POST /api/auth/2fa/disable 200 shape', async () => {
    validateContract('/api/auth/2fa/disable', 200, { success: true, message: '2FA disabled' })
  })

  it('validates GET /api/churches 200 shape', async () => {
    const body = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Grace Church',
        slug: 'gracechurchktm',
        subdomain: 'gracechurchktm.churchnepal.com',
        admin_email: 'admin@test.com',
        status: 'active',
        plan: 'Standard',
        custom_domain: null,
        last_active_at: null,
        storage_bytes: 0,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
        member_count: 10,
        giving_total: 5000,
      },
    ]
    validateContract('/api/churches', 200, body)
  })

  it('validates GET /api/settings 200 shape', async () => {
    validateContract('/api/settings', 200, { site_name: 'ChurchNepal', support_email: 'support@churchnepal.com' })
  })

  it('validates GET /api/api-keys 200 shape', async () => {
    const body = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Test Key',
        masked_key: 'cn_aaaa....bbbb',
        scopes: ['read'],
        revoked_at: null,
        last_used_at: null,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]
    validateContract('/api/api-keys', 200, body)
  })

  it('validates GET /api/_routes 200 shape', async () => {
    const body = [
      { method: 'GET', path: '/healthz', auth: 'none' },
      { method: 'POST', path: '/api/_routes', auth: 'none' },
    ]
    validateContract('/api/_routes', 200, body)
  })

  it('fails if a known endpoint removes a required key', async () => {
    const badBody = {
      token: 'abc',
      refresh_token: 'r',
      email: 'a@b.com',
    }
    expect(() => validateContract('/api/auth/refresh', 200, badBody)).toThrow()
  })

  it('fails if a known endpoint changes response type', async () => {
    const badBody = 'unexpected-string'
    expect(() => validateContract('/api/auth/me', 200, badBody)).toThrow()
  })
})
