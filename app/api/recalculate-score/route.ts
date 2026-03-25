import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { home_id } = await request.json()
  if (!home_id) return NextResponse.json({ error: 'No home_id' }, { status: 400 })

  const { data, error } = await supabase.rpc('recalculate_health_score', { p_home_id: home_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ score: data })
}