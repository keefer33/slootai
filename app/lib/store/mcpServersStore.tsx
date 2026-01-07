import { create } from 'zustand'
import type { Tool } from '~/shared/ToolCard'
import { showNotification } from '../notificationUtils'
import { generateNewApiKey, getSession, showError, supabase } from '../utils'
import createUniversalSelectors from './universalSelectors'

interface McpServer {
  id: string
  server_name: string
  server_url: string
  type: 'connect' | 'public' | 'private'
  apikey?: string
  user_id: string
  created_at?: string
  updated_at?: string
  tools?: any[]
}

interface McpServersState {
  // State
  mcpServers: McpServer[]
  error: string | null
  selectedMcpServer: McpServer | null
  attachedTools: Tool[]
  unattachedTools: Tool[]
  server: McpServer | null
  serverTools: any[]
  availableTools: Tool[]
  attachedMcpServers: McpServer[]
  unattachedMcpServers: McpServer[]
  getAttachedMcpServers: () => McpServer[]
  getUnattachedMcpServers: () => McpServer[]
  setAttachedMcpServers: (servers: McpServer[]) => void
  setUnattachedMcpServers: (servers: McpServer[]) => void
  setSelectedMcpServer: (server: McpServer | null) => void

  // Actions
  setMcpServers: (servers: McpServer[]) => void
  getMcpServers: () => McpServer[]
  setError: (error: string | null) => void
  setAttachedTools: (tools: Tool[]) => void
  setUnattachedTools: (tools: Tool[]) => void
  setServer: (server: McpServer | null) => void
  setServerTools: (tools: any[]) => void
  setAvailableTools: (tools: Tool[]) => void
  getServerTools: () => any[]

  // Computed values
  getAttachedToolObjects: () => Tool[]
  getAllAvailableTools: () => Tool[]

  // CRUD Operations
  loadMcpServers: () => Promise<McpServer[]>
  loadMcpServer: (serverId: string) => Promise<McpServer | null>
  createMcpServer: (serverData: Partial<McpServer>) => Promise<McpServer | null>
  updateMcpServer: (serverId: string, updates: Partial<McpServer>) => Promise<boolean>
  deleteMcpServer: (serverId: string) => Promise<boolean>
  loadServerTools: (serverId: string) => Promise<any[]>
  loadAvailableTools: () => Promise<Tool[]>
  attachToolToServer: (serverId: string, toolId: string) => Promise<boolean>
  detachToolFromServer: (serverToolId: number) => Promise<boolean>

  // Utility functions

  regenerateMcpServerApiKey: (serverId: string) => Promise<string | null>
}

const useMcpServersStoreBase = create<McpServersState>((set, get: any) => ({
  // Initial state
  mcpServers: [],
  error: null,
  selectedMcpServer: null,
  attachedTools: [],
  unattachedTools: [],
  server: null,
  serverTools: [],
  availableTools: [],
  attachedMcpServers: [],
  unattachedMcpServers: [],
  getAttachedMcpServers: () => get().attachedMcpServers,
  getUnattachedMcpServers: () => get().unattachedMcpServers,
  setAttachedMcpServers: (servers) => set({ attachedMcpServers: servers }),
  setUnattachedMcpServers: (servers) => set({ unattachedMcpServers: servers }),
  setAttachedTools: (tools) => set({ attachedTools: tools }),
  setUnattachedTools: (tools) => set({ unattachedTools: tools }),
  setSelectedMcpServer: (data) => set((state) => ({ ...state, selectedMcpServer: data })),
  setServer: (server) => set({ server }),
  setServerTools: (tools) => set({ serverTools: tools }),
  setAvailableTools: (tools) => set({ availableTools: tools }),
  getAllAvailableTools: () => get().availableTools,
  getServerTools: () => get().serverTools,
  setMcpServers: (servers) => set({ mcpServers: servers }),
  getMcpServers: () => get().mcpServers,
  setError: (error) => set({ error }),

  // Computed values
  getAttachedToolObjects: () => {
    const { serverTools, availableTools } = get()
    const attachedToolIds: string[] = []
    const attachedToolObjects: Tool[] = []

    serverTools.forEach((st) => {
      if (st && st.user_tool_id) {
        // Try to find the tool in availableTools
        const userTool = availableTools.find((tool) => tool && tool.id === st.user_tool_id)
        if (userTool) {
          attachedToolIds.push(st.user_tool_id)
          attachedToolObjects.push(userTool)
        }
      }
    })

    return attachedToolObjects
  },

  loadMcpServer: async (serverId: string) => {
    const { data, error } = await supabase.from('user_mcp_servers').select('*').eq('id', serverId).single()
    if (error) {
      console.error('Error loading MCP server:', error)
      showError(error)
      return null
    }
    if (!data) {
      showError(error)
      return null
    }
    set({ server: data })
    return data
  },

  // Load MCP servers from the API
  loadMcpServers: async () => {
    const session = await getSession()

    const { data, error } = await supabase.from('user_mcp_servers').select('*').eq('user_id', session?.user?.id).order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading MCP servers:', error)
      showError(error)
      return []
    }

    const servers = data || []
    set({ mcpServers: servers })
    return servers
  },

  // Create a new MCP server
  createMcpServer: async (serverData) => {
    const session = await getSession()
    set({ error: null })

    const { data, error } = await supabase
      .from('user_mcp_servers')
      .insert({
        ...serverData,
        user_id: session?.user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating MCP server:', error)
      showError(error)
      return null
    }

    // Add to local state
    const { mcpServers } = get()
    set({ mcpServers: [data, ...mcpServers] })
    return data
  },

  // Update an existing MCP server
  updateMcpServer: async (serverId, updates) => {
    const session = await getSession()

    const { error } = await supabase.from('user_mcp_servers').update(updates).eq('id', serverId).eq('user_id', session?.user?.id)

    if (error) {
      showError(error)
      return false
    }

    // Update in local state
    const { mcpServers } = get()
    const updatedServers = mcpServers.map((server) => (server.id === serverId ? { ...server, ...updates } : server))
    set({ mcpServers: updatedServers })
    //showNotification({ title: 'Success', message: 'MCP server updated successfully', type: 'success' })
    return true
  },

  // Delete an MCP server
  deleteMcpServer: async (serverId) => {
    const session = await getSession()
    set({ error: null })

    if (!session?.user?.id) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return false
    }

    const { error } = await supabase.from('user_mcp_servers').delete().eq('id', serverId).eq('user_id', session?.user?.id)

    if (error) {
      console.error('Error deleting MCP server:', error)
      showError(error)
      return false
    }

    // Remove from local state
    const { mcpServers } = get()
    const filteredServers = mcpServers.filter((server) => server.id !== serverId)
    set({ mcpServers: filteredServers })
    showNotification({ title: 'Success', message: 'MCP server deleted successfully', type: 'success' })
    return true
  },

  // Regenerate API key for an MCP server
  regenerateMcpServerApiKey: async (serverId) => {
    const session = await getSession()

    const newApiKey = generateNewApiKey()
    const { error } = await supabase.from('user_mcp_servers').update({ apikey: newApiKey }).eq('id', serverId).eq('user_id', session?.user?.id).select('apikey').single()

    if (error) {
      console.error('Error regenerating API key:', error)
      showError(error)
      return null
    }

    // Update in local state
    const { mcpServers } = get()
    const updatedServers = mcpServers.map((server) => (server.id === serverId ? { ...server, apikey: newApiKey } : server))
    set({ mcpServers: updatedServers })
    showNotification({ title: 'Success', message: 'API key regenerated successfully', type: 'success' })
    return newApiKey
  },

  loadServerTools: async (serverId: string) => {
    const { data, error } = await supabase
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

    if (error) {
      showError(error)
      return []
    }

    const tools = data || []
    set({ serverTools: tools })
    return tools
  },

  loadAvailableTools: async () => {
    const session = await getSession()
    const { data, error } = await supabase.from('user_tools').select('*').eq('user_id', session?.user?.id).order('created_at', { ascending: false })

    if (error) {
      showError(error)
      return []
    }
    const tools = data || []
    set({ availableTools: tools })
    return tools
  },

  attachToolToServer: async (serverId: string, toolId: string) => {
    // Ensure both IDs are valid
    if (!serverId || !toolId) {
      showError('Invalid server ID or tool ID')
      return false
    }

    const { error } = await supabase
      .from('user_mcp_server_tools')
      .insert({
        user_mcp_server_id: serverId,
        user_tool_id: toolId,
      })
      .select('*')
      .single()

    if (error) {
      showError(error)
      return false
    }

    // Update local state immediately
    const tool = get()
      .getAllAvailableTools()
      .find((t) => t.id === toolId)
    if (tool) {
      // Remove from unattached tools
      const newUnattachedTools = get().unattachedTools.filter((t) => t.id !== toolId)
      set({ unattachedTools: newUnattachedTools })

      // Add to attached tools
      const newAttachedTools = [...get().attachedTools, tool]
      set({ attachedTools: newAttachedTools })
    }

    get().loadServerTools(get().server?.id)
    return true
  },

  detachToolFromServer: async (serverToolId: number) => {
    // Find the tool to detach before deleting
    const serverTool = get().serverTools.find((st) => st.id === serverToolId)
    const tool = serverTool
      ? get()
          .getAllAvailableTools()
          .find((t) => t.id === serverTool.user_tool_id)
      : null

    const { error } = await supabase.from('user_mcp_server_tools').delete().eq('id', serverToolId)

    if (error) {
      showError(error)
      return false
    }

    // Update local state immediately
    if (tool) {
      // Remove from attached tools
      const newAttachedTools = get().attachedTools.filter((t) => t.id !== tool.id)
      set({ attachedTools: newAttachedTools })

      // Add back to unattached tools
      const newUnattachedTools = [...get().unattachedTools, tool]
      set({ unattachedTools: newUnattachedTools })
    }

    get().loadServerTools(get().server?.id)
    return true
  },
}))

export default createUniversalSelectors(useMcpServersStoreBase)
export type { McpServer }
