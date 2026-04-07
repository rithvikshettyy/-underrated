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
      // Use hosted URL in production or origin in development
      const isDev = process.env.NODE_ENV === 'development'
      const redirectUrl = isDev 
        ? `${origin}${next}`
        : `https://underrated-ten.vercel.app${next}`

      return NextResponse.redirect(redirectUrl)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?error=auth-code-exchange-failed`)
}
