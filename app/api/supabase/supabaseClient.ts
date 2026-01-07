import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

export const endpoint = import.meta.env.VITE_NODE_ENV === 'development' ? import.meta.env.VITE_LOCAL_API_URL : import.meta.env.VITE_API_URL

export const getClient = async (request) => {
  const supabase = createServerClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.headers
          .get('Cookie')
          ?.split(';')
          .find((c) => c.trim().startsWith(`${name}=`))
          ?.split('=')[1]
      },
    },
  })

  return { supabase }
}

export const loaderCheckCookie = async (request) => {
  try {
    const { supabase } = await getClient(request)
    // Get user with error handling for when no session exists
    let user = null

    const {
      data: { user: userData },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      user = null
    } else {
      user = userData
    }

    return { user: user }
  } catch (error) {
    console.error('Error in loaderCheckCookie:', error)

    // Return a fallback structure to prevent the loader from failing
    return {
      user: null,
    }
  }
}

export const getUser = async (request) => {
  const { supabase } = await getClient(request)
  const { data: user, error } = await supabase.from('user_profiles').select('*').single()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  const token = user?.api_key
  return { user: user, token: token }
}

export const getMcpServers = async (request) => {
  const { supabase } = await getClient(request)
  const { data: servers, error: serverError } = await supabase.from('user_mcp_servers').select('*')
  if (serverError) {
    console.error('Error getting MCP servers:', serverError)
    return serverError
  }
  if (!servers) {
    console.error('MCP servers not found')
    return 'Servers not found'
  }
  return { servers }
}

export const getServer = async (request, serverId: string) => {
  const { supabase } = await getClient(request)
  const { data: server, error: serverError } = await supabase.from('user_mcp_servers').select('*').eq('id', serverId).single()
  if (serverError) {
    console.error('Error getting server:', serverError)
    return serverError
  }
  if (!server) {
    console.error('Server not found')
    return 'Server not found'
  }
  return { server: server }
}

export const getServerTools = async (request, serverId: string) => {
  const { supabase } = await getClient(request)
  const { data: serverTools, error: serverToolsError } = await supabase
    .from('user_mcp_server_tools')
    .select(
      `
      id,
      user_mcp_server_id,
      user_tool_id:user_tool_id,
      tool:user_tools(*) 
`,
    )
    .eq('user_mcp_server_id', serverId)
  if (serverToolsError) {
    console.error('Error getting server tools:', serverToolsError)
    return serverToolsError
  }
  if (!serverTools) {
    console.error('Server tools not found')
    return 'Server tools not found'
  }

  return { serverTools: serverTools }
}

export const getAvailableTools = async (request) => {
  const { supabase } = await getClient(request)
  const { data: availableTools, error: availableToolsError } = await supabase.from('user_tools').select('*').order('created_at', { ascending: false })
  if (availableToolsError) {
    console.error('Error getting available tools:', availableToolsError)
    return availableToolsError
  }
  if (!availableTools) {
    console.error('Available tools not found')
    return 'Available tools not found'
  }
  return { availableTools: availableTools }
}

export const getSlootTools = async (request) => {
  const { token } = await getUser(request)
  try {
    const response = await axios.get(`${endpoint}/tools/sloot`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    return { slootTools: response.data, error: null }
  } catch (error) {
    console.error('Error getting sloot tools:', error)
    return { slootTools: [], error: error }
  }
}

export const getPipedreamMemberApps = async (request) => {
  try {
    const { token } = await getUser(request)
    const memberApps = await axios.post(`${endpoint}/tools/pipedream/member/apps`, {}, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
    return { memberApps: memberApps.data, error: null }
  } catch (error) {
    console.error('Error getting pipedream member apps:', error)
    return { memberApps: [], error: error }
  }
}

export const serviceRoleClient = async () => {
  const supaService = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY)
  return { supaService }
}
