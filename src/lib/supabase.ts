import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string ?? ''
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Surprise Mine] Missing Supabase env vars. ' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel project settings.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
