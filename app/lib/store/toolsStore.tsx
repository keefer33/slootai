import { create } from 'zustand'
import { showNotification } from '../notificationUtils'
import { endpoint, fetchGet, fetchPost, getSession, showError, supabase } from '../utils'
import createUniversalSelectors from './universalSelectors'

interface Tool {
  id: string
  user_id?: string // Optional since sloot tools don't have user_id
  tool_name: string
  schema: object | null | any
  avatar?: string
  is_sloot?: boolean
  created_at: string
  updated_at: string
  messages?: any[]
  response_id?: string
  user_connect_api_id?: string
  pipedream?: object | null | any
  is_pipedream?: boolean
  sloot?: object | null | any // Additional JSON configuration for sloot tools
}

interface ChatMessage {
  role: string
  content: string
}

interface ToolRun {
  id: string
  user_id: string
  tool_id: string
  payload: any
  response: any
  status: 'success' | 'error' | 'pending'
  error_message?: string
  execution_time_ms?: number
  created_at: string
  updated_at: string
}

interface UserPollingFile {
  id: string
  user_id: string
  config: any
  files?: string
  status: 'pending' | 'completed' | 'error' | 'processing'
  created_at: string
  updated_at: string
  duration: number
  cost: number
}

interface ToolsState {
  // State
  session: any | null
  slootTools: Tool[]
  error: string | null
  tools: Tool[]
  selectedTool: Tool | null
  isSlootTool: boolean
  newTool: Tool | null
  loading: boolean

  // Tool Editor State
  editingTool: Tool | null
  saving: boolean
  navbarSaving: boolean
  showAiChat: boolean
  aiLoading: boolean
  messages: ChatMessage[]
  currentMessage: string
  initialPrompt: string
  pendingSchema: any | null
  showSchemaDiff: boolean
  schemaChanges: string

  // Tool Runs State
  toolRuns: ToolRun[]
  selectedRun: ToolRun | null
  runsLoading: boolean
  runsModalOpened: boolean

  // Polling File State
  pollingFiles: Record<string, UserPollingFile | null>
  pollingFileLoading: boolean
  pollingFileError: string | null

  // Actions
  setLoading: (loading: boolean) => void
  setSlootTools: (tools: Tool[]) => void
  getSlootTools: () => Tool[]
  setError: (error: string | null) => void
  setTools: (tools: Tool[]) => void
  getTools: () => Tool[]
  createTool: (tool: Tool) => Promise<Tool | null>
  setSelectedTool: (tool: Tool | null) => void
  setNewTool: (tool: Tool | null) => void
  getNewTool: () => Tool | null

  // Tool Editor Actions
  setEditingTool: (tool: Tool | null) => void
  setSaving: (saving: boolean) => void
  setNavbarSaving: (saving: boolean) => void
  setShowAiChat: (show: boolean) => void
  setAiLoading: (loading: boolean) => void
  setMessages: (messages: ChatMessage[]) => void
  setCurrentMessage: (message: string) => void
  setInitialPrompt: (prompt: string) => void
  setPendingSchema: (schema: any | null) => void
  setShowSchemaDiff: (show: boolean) => void
  setSchemaChanges: (changes: string) => void

  // Tool Runs Actions
  setToolRuns: (runs: ToolRun[]) => void
  setSelectedRun: (run: ToolRun | null) => void
  setRunsLoading: (loading: boolean) => void
  setRunsModalOpened: (opened: boolean) => void

  // Polling File Actions
  setPollingFile: (pollingFileId: string, file: UserPollingFile | null) => void
  setPollingFileLoading: (loading: boolean) => void
  setPollingFileError: (error: string | null) => void

  // Getters
  getEditingTool: () => Tool | null
  getSaving: () => boolean
  getNavbarSaving: () => boolean
  getShowAiChat: () => boolean
  getAiLoading: () => boolean
  getMessages: () => ChatMessage[]
  getCurrentMessage: () => string
  getInitialPrompt: () => string
  getPendingSchema: () => any | null
  getShowSchemaDiff: () => boolean
  getSchemaChanges: () => string

  // Tool Runs Getters
  getToolRuns: () => ToolRun[]
  getSelectedRun: () => ToolRun | null
  getRunsLoading: () => boolean
  getRunsModalOpened: () => boolean

  // Polling File Getters
  getPollingFile: (pollingFileId: string) => UserPollingFile | null
  getPollingFileLoading: () => boolean
  getPollingFileError: () => string | null

  // CRUD Operations
  loadTools: (filter?: 'pipedream' | 'custom' | null) => Promise<void>
  loadSlootTools: () => Promise<void>
  deleteTool: (toolId: string) => Promise<boolean>
  loadSlootTool: (toolId: string) => Promise<Tool | null>
  loadSlootToolByName: (toolName: string) => Promise<Tool | null>
  updateTool: (tool: Tool) => Promise<Tool | null>

  // Tool Editor Operations
  initializeToolEditor: (toolId: string, isAdmin: boolean, userId: string) => Promise<void>
  handleSaveSchema: (userId: string) => Promise<boolean>
  handleNavbarSave: () => Promise<boolean>
  handleAiChat: (action: 'initialize' | 'continue', prompt?: string, userId?: string, authToken?: string) => Promise<void>
  handleAcceptSchema: (userId: string) => Promise<boolean>
  handleDeclineSchema: () => void
  resetToolEditor: () => void

  // Tool Runs Operations
  loadToolRuns: (toolId: string, userId: string) => Promise<void>
  saveToolRun: (payload: any, response: any, status: 'success' | 'error', errorMessage?: string, executionTime?: number, toolId?: string, userId?: string) => Promise<void>
  selectRun: (run: ToolRun | null) => void
  openRunsModal: () => void
  closeRunsModal: () => void

  // Polling File Operations
  fetchPollingFile: (pollingFileId: string, authToken: string) => Promise<void>
  resetPollingFile: () => void
  clearPollingFile: (pollingFileId: string) => void
  resetRunsModalState: () => void
  runTool: (payload: any, authToken: string) => Promise<any>
}

const useToolsStoreBase = create<ToolsState>((set, get: any) => ({
  // Initial state
  loading: false,
  session: async () => await getSession(),
  slootTools: [],
  error: null,
  tools: [],
  selectedTool: null,
  isSlootTool: false,
  newTool: null,

  // Tool Editor State
  editingTool: null,
  saving: false,
  navbarSaving: false,
  showAiChat: false,
  aiLoading: false,
  messages: [],
  currentMessage: '',
  initialPrompt: '',
  pendingSchema: null,
  showSchemaDiff: false,
  schemaChanges: '',

  // Tool Runs State
  toolRuns: [],
  selectedRun: null,
  runsLoading: false,
  runsModalOpened: false,

  // Polling File State
  pollingFiles: {},
  pollingFileLoading: false,
  pollingFileError: null,
  setLoading: (loading) => set({ loading }),
  getLoading: () => get().loading,
  setNewTool: (tool) => set({ newTool: tool }),
  setTools: (data) => set((state) => ({ ...state, tools: data })),
  getTools: () => {
    return get().tools
  },
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  getNewTool: () => {
    return get().newTool
  },
  getIsSlootTool: () => get().isSlootTool,
  // Basic setters
  setSlootTools: (tools) => set({ slootTools: tools }),
  getSlootTools: () => {
    return get().slootTools
  },
  setError: (error) => set({ error }),

  // Tool Editor Actions
  setEditingTool: (tool) => set({ editingTool: tool }),
  setSaving: (saving) => set({ saving }),
  setNavbarSaving: (saving) => set({ navbarSaving: saving }),
  setShowAiChat: (show) => set({ showAiChat: show }),
  setAiLoading: (loading) => set({ aiLoading: loading }),
  setMessages: (messages) => set({ messages }),
  setCurrentMessage: (message) => set({ currentMessage: message }),
  setInitialPrompt: (prompt) => set({ initialPrompt: prompt }),
  setPendingSchema: (schema) => set({ pendingSchema: schema }),
  setShowSchemaDiff: (show) => set({ showSchemaDiff: show }),
  setSchemaChanges: (changes) => set({ schemaChanges: changes }),

  // Tool Editor Getters
  getEditingTool: () => get().editingTool,
  getSaving: () => get().saving,
  getNavbarSaving: () => get().navbarSaving,
  getShowAiChat: () => get().showAiChat,
  getAiLoading: () => get().aiLoading,
  getMessages: () => get().messages,
  getCurrentMessage: () => get().currentMessage,
  getInitialPrompt: () => get().initialPrompt,
  getPendingSchema: () => get().pendingSchema,
  getShowSchemaDiff: () => get().showSchemaDiff,
  getSchemaChanges: () => get().schemaChanges,

  // Tool Runs Actions
  setToolRuns: (runs) => set({ toolRuns: runs }),
  setSelectedRun: (run) => set({ selectedRun: run }),
  setRunsLoading: (loading) => set({ runsLoading: loading }),
  setRunsModalOpened: (opened) => set({ runsModalOpened: opened }),

  // Polling File Actions
  setPollingFile: (pollingFileId, file) => set((state) => ({ pollingFiles: { ...state.pollingFiles, [pollingFileId]: file } })),
  setPollingFileLoading: (loading) => set({ pollingFileLoading: loading }),
  setPollingFileError: (error) => set({ pollingFileError: error }),

  // Tool Runs Getters
  getToolRuns: () => get().toolRuns,
  getSelectedRun: () => get().selectedRun,
  getRunsLoading: () => get().runsLoading,
  getRunsModalOpened: () => get().runsModalOpened,

  // Polling File Getters
  getPollingFile: (pollingFileId) => get().pollingFiles[pollingFileId] || null,
  getPollingFileLoading: () => get().pollingFileLoading,
  getPollingFileError: () => get().pollingFileError,

  loadTools: async (filter?: 'pipedream' | 'custom' | null) => {
    const { data, error } = await supabase.from('user_tools').select('*').order('created_at', { ascending: false })
    if (error) {
      showError(error)
    } else {
      //filter out sloot tools from the tools in case the person is an admin
      const toolsFiltered = data?.filter((tool) => !tool.is_sloot) || []
      if (!filter) {
        set({ tools: toolsFiltered })
      } else {
        if (filter === 'pipedream') {
          const userToolsList = toolsFiltered?.filter((tool) => tool.is_pipedream) || []
          set({ tools: userToolsList })
        } else {
          const userToolsList = toolsFiltered?.filter((tool) => !tool.is_pipedream) || []
          set({ tools: userToolsList })
        }
      }
    }
  },

  loadSlootTools: async () => {
    const { data, error } = await supabase.from('user_tools').select('*').eq('is_sloot', true).order('created_at', { ascending: false })
    if (error) {
      showError(error)
    } else {
      console.log('data', data)
      set({ slootTools: data || [] })
    }
  },

  deleteTool: async (toolId: string) => {
    const session = await getSession()
    const { error } = await supabase.from('user_tools').delete().eq('id', toolId).eq('user_id', session?.user?.id)

    if (error) {
      showError(error)
      return false
    }

    showNotification({ title: 'Success', message: 'Tool deleted successfully', type: 'success' })
    return true
  },

  createTool: async (tool: Tool) => {
    // Helper function to safely parse JSON
    const safeJsonParse = (value: any) => {
      if (!value) return null
      if (typeof value === 'object') return value
      if (typeof value === 'string') {
        try {
          // Clean the string by removing control characters
          const cleaned = value.replace(/[\x00-\x1F\x7F]/g, '')
          return JSON.parse(cleaned)
        } catch (error) {
          console.warn('Failed to parse JSON, using string value:', error)
          return value
        }
      }
      return value
    }

    // Prepare tool data with JSON serialization for complex fields
    const toolData = {
      ...tool,
      sloot: safeJsonParse(tool.sloot),
      schema: safeJsonParse(tool.schema),
      pipedream: safeJsonParse(tool.pipedream),
    }

    const { data, error } = await supabase.from('user_tools').insert(toolData).select().single()
    if (error) {
      showError(error)
      return false
    }
    return data
  },

  loadSlootTool: async (toolId: string) => {
    // First try to find by ID
    const { data, error } = await supabase.from('user_tools').select('*').eq('id', toolId).single()
    if (error) {
      showError(error)
      return null
    }
    return data
  },

  loadSlootToolByName: async (toolName: string) => {
    const { data, error } = await supabase.from('user_tools').select('*').eq('schema->>name', toolName).single()
    if (error) {
      showError(error)
      return null
    }
    return data
  },

  updateTool: async (tool: Tool) => {
    const session = await getSession()

    // Helper function to safely parse JSON
    const safeJsonParse = (value: any) => {
      if (!value) return null
      if (typeof value === 'object') return value
      if (typeof value === 'string') {
        try {
          // Clean the string by removing control characters
          const cleaned = value.replace(/[\x00-\x1F\x7F]/g, '')
          return JSON.parse(cleaned)
        } catch (error) {
          console.warn('Failed to parse JSON, using string value:', error)
          return value
        }
      }
      return value
    }

    // Prepare tool data with JSON serialization for complex fields
    const toolData = {
      ...tool,
      sloot: safeJsonParse(tool.sloot),
      schema: safeJsonParse(tool.schema),
      pipedream: safeJsonParse(tool.pipedream),
    }

    const { data, error } = await supabase.from('user_tools').update(toolData).eq('id', tool.id).eq('user_id', session?.user?.id).select().single()
    if (error) {
      showError(error)
      return null
    }

    // Update the tools list with the updated tool
    const { tools, editingTool, selectedTool } = get()
    const updatedTools = tools?.map((t) => (t.id === data.id ? data : t)) || []

    // Update editingTool if it matches the updated tool
    if (editingTool?.id === data.id) {
      set({ editingTool: data })
    }

    // Update selectedTool if it matches the updated tool
    if (selectedTool?.id === data.id) {
      set({ selectedTool: data })
    }

    set({ tools: updatedTools })

    showNotification({ title: 'Success', message: 'Tool updated successfully', type: 'success' })
    return data
  },

  // Tool Editor Operations
  initializeToolEditor: async (toolId: string, isAdmin: boolean, userId: string) => {
    set({ loading: true })

    // Completely clear ALL editor state before loading new tool
    get().resetToolEditor()

    await get().loadTools()

    if (isAdmin) {
      await get().loadSlootTools()
    }

    // Find the tool from already loaded collections
    const tool =
      get()
        .getTools()
        ?.find((t) => t.id === toolId) ||
      get()
        .getSlootTools()
        ?.find((t) => t.id === toolId) ||
      null
    set({ isSlootTool: (tool?.is_sloot && !isAdmin) || tool?.is_pipedream || false })

    // Load messages if available
    if (tool?.messages && Array.isArray(tool?.messages)) {
      const lastTwoMessages = tool.messages.slice(-2)
      set({ messages: lastTwoMessages })
    }

    set({ selectedTool: tool as Tool })
    set({ loading: false })

    get().loadToolRuns(toolId, userId)
  },

  handleSaveSchema: async (userId: string) => {
    const { selectedTool, isSlootTool, schemaChanges } = get()
    if (!selectedTool || isSlootTool || !schemaChanges) return false

    set({ saving: true })
    let schemaJson: any
    try {
      schemaJson = JSON.parse(schemaChanges)
    } catch {
      showNotification({ title: 'Error', message: 'Invalid JSON format', type: 'error' })
      set({ saving: false })
      return false
    }

    const { error } = await supabase.from('user_tools').update({ schema: schemaJson }).eq('id', selectedTool.id).eq('user_id', userId)

    if (error) {
      showNotification({ title: 'Error', message: error.message, type: 'error' })
      set({ saving: false })
      return false
    }

    // Update local state
    set({ selectedTool: { ...selectedTool, schema: schemaJson } })
    set({ schemaChanges: '' }) // Clear pending changes
    showNotification({ title: 'Success', message: 'Schema saved successfully', type: 'success' })
    set({ saving: false })
    return true
  },

  handleNavbarSave: async () => {
    const { editingTool, isSlootTool, tools, selectedTool } = get()
    if (!editingTool || isSlootTool) return false

    set({ navbarSaving: true })
    const updatedTool = {
      ...editingTool,
      sloot: typeof editingTool.sloot === 'string' ? JSON.parse(editingTool.sloot) : editingTool.sloot,
    }

    await get().updateTool(updatedTool as Tool)

    // Update local state
    set({ tools: tools?.map((t) => (t.id === editingTool.id ? (updatedTool as Tool) : t)) || [] })
    if (selectedTool?.id === editingTool.id) {
      set({ selectedTool: updatedTool as Tool })
    }
    set({ navbarSaving: false })
    return true
  },

  handleAiChat: async (action: 'initialize' | 'continue', prompt?: string, userId?: string, authToken?: string) => {
    const { selectedTool, isSlootTool, currentMessage, messages } = get()
    if (!userId || !selectedTool || isSlootTool || !authToken) {
      showNotification({
        title: 'Error',
        message: isSlootTool ? 'AI chat is not available for read-only tools' : 'User not authenticated or tool not loaded',
        type: 'error',
      })
      return
    }

    set({ aiLoading: true })

    const requestData: any = {
      action,
      userId,
      toolName: selectedTool.tool_name,
    }

    if (action === 'initialize') {
      requestData.prompt = prompt || 'Help me create a schema for this tool'
      // Include current schema if it exists
      if (selectedTool.schema) {
        requestData.currentSchema = typeof selectedTool.schema === 'string' ? selectedTool.schema : JSON.stringify(selectedTool.schema, null, 2)
      }
    } else {
      requestData.message = currentMessage
      requestData.responseId = selectedTool.response_id
      // Include current schema for context
      if (selectedTool.schema) {
        requestData.currentSchema = typeof selectedTool.schema === 'string' ? selectedTool.schema : JSON.stringify(selectedTool.schema, null, 2)
      }
    }

    const data = await get().generateSchema(requestData, authToken)

    if (data.success) {
      let newMessages: ChatMessage[]
      let newResponseId: string

      if (action === 'initialize') {
        newMessages = [
          { role: 'user', content: prompt || 'Help me create a schema for this tool' },
          { role: 'assistant', content: data.message },
        ]
        newResponseId = data.responseId
      } else {
        newMessages = [...messages, { role: 'user', content: currentMessage }, { role: 'assistant', content: data.message }]
        newResponseId = data.responseId
      }

      set({ messages: newMessages, currentMessage: '' })

      // Save messages and responseId to database
      const { error } = await supabase.from('user_tools').update({ response_id: newResponseId, messages: newMessages }).eq('id', selectedTool.id).eq('user_id', userId)
      if (error) {
        console.error('Error saving messages:', error)
      } else {
        // Update local state with new response_id
        set({ selectedTool: { ...selectedTool, response_id: newResponseId, messages: newMessages } })
      }

      // If schema was generated, show it as pending
      if (data.schema) {
        // Ensure the schema is properly formatted
        let formattedSchema = data.schema
        if (typeof data.schema === 'string') {
          try {
            formattedSchema = JSON.parse(data.schema)
          } catch (error) {
            console.error('Error parsing schema string:', error)
            showNotification({ title: 'Error', message: 'Invalid schema format received from AI', type: 'error' })
            set({ aiLoading: false })
            return
          }
        }

        // Check if the new schema is different from the current one
        const currentSchemaString = typeof selectedTool.schema === 'string' ? selectedTool.schema : JSON.stringify(selectedTool.schema, null, 2)
        const newSchemaString = JSON.stringify(formattedSchema, null, 2)

        if (currentSchemaString === newSchemaString) {
          showNotification({ title: 'Info', message: 'The generated schema is identical to the current one. No changes needed.', type: 'info' })
          set({ aiLoading: false })
          return
        }

        // Remove the schema from the message content to avoid showing it in chat
        const messageWithoutSchema = data.message.replace(/```json\s*[\s\S]*?```/g, '').trim()

        // Update the last message to remove the schema
        if (action === 'initialize') {
          newMessages = [
            { role: 'user', content: prompt || 'Help me create a schema for this tool' },
            { role: 'assistant', content: messageWithoutSchema || 'I have generated a schema for you. Please review it in the editor above.' },
          ]
        } else {
          newMessages = [
            ...messages,
            { role: 'user', content: currentMessage },
            { role: 'assistant', content: messageWithoutSchema || 'I have generated a schema for you. Please review it in the editor above.' },
          ]
        }

        set({ messages: newMessages, pendingSchema: formattedSchema, showSchemaDiff: true })
        showNotification({ title: 'Success', message: 'Schema generated! Review and accept or decline.', type: 'success' })
      }
    }
    set({ aiLoading: false })
  },

  generateSchema: async (jsonString: string, authToken: string) => {
    const response = await fetchPost({
      endpoint: `${endpoint}/utils/tools-schema-generator`,
      body: jsonString,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      showNotifications: false,
    })
    return response
  },

  handleAcceptSchema: async (userId: string) => {
    const { selectedTool, showSchemaDiff, pendingSchema, schemaChanges } = get()
    if (!selectedTool) return false

    set({ saving: true })

    // Get the current schema value (which may have been updated by the merge view)
    const currentSchemaValue =
      showSchemaDiff && pendingSchema
        ? JSON.stringify(pendingSchema, null, 2)
        : schemaChanges || (typeof selectedTool.schema === 'string' ? selectedTool.schema : JSON.stringify(selectedTool.schema, null, 2))

    let schemaToSave
    try {
      schemaToSave = JSON.parse(currentSchemaValue)
    } catch {
      showNotification({ title: 'Error', message: 'Invalid JSON format', type: 'error' })
      set({ saving: false })
      return false
    }

    const { error } = await supabase.from('user_tools').update({ schema: schemaToSave }).eq('id', selectedTool.id).eq('user_id', userId)

    if (error) {
      showNotification({ title: 'Error', message: error.message, type: 'error' })
      set({ saving: false })
      return false
    }

    // Update local state
    set({ selectedTool: { ...selectedTool, schema: schemaToSave } })
    set({ pendingSchema: null })
    set({ showSchemaDiff: false })
    showNotification({ title: 'Success', message: 'Schema updated successfully', type: 'success' })
    set({ saving: false })
    return true
  },

  handleDeclineSchema: () => {
    set({ pendingSchema: null, showSchemaDiff: false })
    showNotification({ title: 'Info', message: 'Schema changes discarded', type: 'info' })
  },

  resetToolEditor: () => {
    set({
      selectedTool: null,
      editingTool: null,
      saving: false,
      navbarSaving: false,
      showAiChat: false,
      aiLoading: false,
      messages: [],
      currentMessage: '',
      initialPrompt: '',
      pendingSchema: null,
      showSchemaDiff: false,
      schemaChanges: '',
      toolRuns: [],
      selectedRun: null,
      runsLoading: false,
      runsModalOpened: false,
      pollingFiles: {},
      pollingFileLoading: false,
      pollingFileError: null,
    })
  },

  runTool: async (payload: any, authToken: string) => {
    const result = await fetchPost({ endpoint: `${endpoint}/tools/run`, body: payload, headers: { Authorization: `Bearer ${authToken}` }, showNotifications: true })
    return result
  },

  // Tool Runs Operations
  loadToolRuns: async (toolId: string, userId: string) => {
    set({ runsLoading: true })
    try {
      const { data, error } = await supabase.from('user_tools_runs').select('*').eq('user_id', userId).eq('tool_id', toolId).order('created_at', { ascending: false }).limit(50)

      if (error) {
        console.error('Error loading tool runs:', error)
      } else {
        set({ toolRuns: data || [] })
        if (data && data.length > 0 && !get().selectedRun) {
          set({ selectedRun: data[0] })
        }
      }
    } catch (error) {
      console.error('Error loading tool runs:', error)
    } finally {
      set({ runsLoading: false })
    }
  },

  saveToolRun: async (payload: any, response: any, status: 'success' | 'error', errorMessage?: string, executionTime?: number, toolId?: string, userId?: string) => {
    if (!userId || !toolId) return

    try {
      const { data, error } = await supabase
        .from('user_tools_runs')
        .insert({
          user_id: userId,
          tool_id: toolId,
          payload,
          response,
          status,
          error_message: errorMessage,
          execution_time_ms: executionTime,
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving tool run:', error)
      } else {
        // Reload runs after saving and select the new run
        await get().loadToolRuns(toolId, userId)
        if (data) {
          set({ selectedRun: data })
        }
      }
    } catch (error) {
      console.error('Error saving tool run:', error)
    }
  },

  selectRun: (run) => set({ selectedRun: run }),
  openRunsModal: () => {
    get().resetRunsModalState()

    // Select the most recent run if available
    if (get().getToolRuns().length > 0) {
      get().selectRun(get().getToolRuns()[0])
    }
    set({ runsModalOpened: true })
  },

  closeRunsModal: () => set({ runsModalOpened: false }),

  // Polling File Operations
  fetchPollingFile: async (pollingFileId: string, authToken: string) => {
    set({ pollingFileLoading: true, pollingFileError: null })
    try {
      const response = await fetchGet({ endpoint: `${endpoint}/tools/polling-file/${pollingFileId}`, headers: { Authorization: `Bearer ${authToken}` } })
      get().setPollingFile(pollingFileId, response.data)
    } catch (err) {
      console.error('Error fetching polling file:', err)
      set({ pollingFileError: 'Failed to fetch polling file data' })
    } finally {
      set({ pollingFileLoading: false })
    }
  },

  resetPollingFile: () => set({ pollingFiles: {}, pollingFileLoading: false, pollingFileError: null }),
  clearPollingFile: (pollingFileId) =>
    set((state) => {
      const newPollingFiles = { ...state.pollingFiles }
      delete newPollingFiles[pollingFileId]
      return { pollingFiles: newPollingFiles }
    }),

  resetRunsModalState: () => set({ selectedRun: null, pollingFiles: {}, pollingFileError: null }),
}))

export default createUniversalSelectors(useToolsStoreBase)
export type { ChatMessage, Tool, ToolRun, UserPollingFile }
