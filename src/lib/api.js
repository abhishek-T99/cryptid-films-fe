/**
 * Thin wrapper around `fetch` for talking to the Django backend.
 *
 * `VITE_API_BASE_URL` decides where requests go:
 *   - left empty, paths stay relative and Vite's dev proxy forwards /api to
 *     Django, so the browser sees one origin and CORS never comes up;
 *   - set to an absolute URL, requests go straight to that host, which is what
 *     a deployed build does.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status, data }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function buildUrl(path) {
  const normalised = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL}/api${normalised}`
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE'])

async function request(path, { method = 'GET', body, signal, ...rest } = {}) {
  // DRF's SessionAuthentication enforces CSRF on unsafe methods. The backend
  // seeds the csrftoken cookie on /api/health/, which App.jsx calls at
  // startup; read it back and echo it in the header Django expects.
  //
  // The cookie is only readable when the API shares the page's origin — true
  // through the dev proxy, and in production when the API is on a subdomain
  // of the frontend with CSRF_COOKIE_DOMAIN set. On a fully cross-site setup
  // use token authentication instead, where CSRF does not apply.
  const csrfToken = SAFE_METHODS.has(method) ? null : readCookie('csrftoken')

  const response = await fetch(buildUrl(path), {
    method,
    // Session cookies ride along; the backend sets CORS_ALLOW_CREDENTIALS.
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
      ...rest.headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal,
  })

  // 204 and other empty responses have no body to parse.
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(`${method} ${path} failed with ${response.status}`, {
      status: response.status,
      data,
    })
  }

  return data
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

export const getHealth = (options) => api.get('/health/', options)
