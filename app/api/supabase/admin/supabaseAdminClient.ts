import { createClient } from '@supabase/supabase-js'

export const supabaseAdminClient = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY)
