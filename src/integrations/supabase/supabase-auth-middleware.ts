import { createMiddleware } from '@tanstack/react-start'
import { supabase } from '@/integrations/supabase/client'

async function getAccessToken(): Promise<string | null> {
  // 1) tentative principale
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) return session.access_token
  } catch (e) {
    console.warn('[withSupabaseAuth] getSession threw', e)
  }
  // 2) fallback : lire directement le storage Supabase (clé sb-<ref>-auth-token)
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue
        const raw = window.localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        const token = parsed?.access_token ?? parsed?.currentSession?.access_token
        if (token) return token
      }
    }
  } catch (e) {
    console.warn('[withSupabaseAuth] localStorage fallback failed', e)
  }
  return null
}

export const withSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const token = await getAccessToken()
    if (!token) {
      console.warn('[withSupabaseAuth] no access token available — server call sera 401')
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }
)