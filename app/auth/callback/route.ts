import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Create the redirection response
      const isProduction = process.env.NODE_ENV === 'production'
      const baseUrl = isProduction ? 'https://underrated-ten.vercel.app' : origin
      const response = NextResponse.redirect(`${baseUrl}/`)

      // CRITICAL: We must ensure session cookies are passed into the redirect response
      // When using createServerClient with headers/cookies, the exchangeCodeForSession
      // will set headers in the cookieStore, but NextResponse.redirect creates a NEW response
      // that needs those cookies manually applied if they aren't already synced.
      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?error=auth-code-exchange-failed`)
}
