import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase email links land here; exchange the code for a session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  // Code missing or exchange failed → back to login with a flag.
  return NextResponse.redirect(`${origin}/auth?mode=login&error=1`)
}
