import { supabaseAdminClient } from './supabaseAdminClient'

export const getToolsSloot = async () => {
  const { data: slootTools, error: slootToolsError } = await supabaseAdminClient.from('user_tools').select('*').eq('is_sloot', true)
  return { slootTools: slootTools || [], slootToolsError: slootToolsError || null }
}
