import { ApiResponse } from "../../shared/types"

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // Build headers: start with a JSON content-type, then merge any provided init.headers.
  const combinedHeaders: Record<string, string> = { 'Content-Type': 'application/json' }

  if (init && init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        combinedHeaders[key] = value
      })
    } else if (Array.isArray(init.headers)) {
      for (const [key, value] of init.headers) {
        combinedHeaders[String(key)] = String(value)
      }
    } else {
      Object.assign(combinedHeaders, init.headers as Record<string, string>)
    }
  }

  // Add Authorization header from localStorage if available (guard against SSR)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || undefined
    if (token) {
      combinedHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(path, { ...init, headers: combinedHeaders })

  // Attempt to parse JSON safely and provide better error messages if parsing fails or fields are missing.
  let json: ApiResponse<T> | undefined
  const text = await res.text().catch(() => '') // if reading body fails, fallback to empty string
  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse<T>
    } catch (e) {
      throw new Error(`Request failed: ${res.status} ${res.statusText} - invalid JSON response`)
    }
  }

  if (!res.ok || !json?.success || json.data === undefined) {
    const errMsg = json?.error || `Request failed: ${res.status} ${res.statusText}`
    throw new Error(errMsg)
  }

  return json.data
}