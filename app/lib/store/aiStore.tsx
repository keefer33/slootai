import { createBrowserClient } from '@supabase/ssr'
import { create } from 'zustand'
import { showNotification } from '../notificationUtils'
import { endpoint, fetchGet, fetchPost } from '../utils'
import createUniversalSelectors from './universalSelectors'

interface User {
  id: string
  email?: string
  access_token?: string
  app_metadata?: {
    provider?: string
    role?: string
  }
  user_metadata?: {
    avatar_url?: string
    is_admin?: boolean
  }
  email_confirmed_at?: string
}

interface Model {
  id: string
  name: string
  provider: string
  description?: string
  max_tokens?: number
  cost_per_token?: number
  model?: string
  brand?: string
  api_url?: string
  config?: {
    capabilities?: {
      mcp?: boolean
      mcp_pipedream?: boolean
      tools?: boolean
      files?: {
        images?: boolean
        files?: boolean
      }
    }
  }
  forms?: any[]
}

interface ApiKey {
  id: string
  name: string
  key: string
  provider: string
  created_at: string
  is_active: boolean
}

interface Agent {
  id: string
  name: string
  description?: string
  prompt?: string
  model_id?: string
  created_at: string
  updated_at: string
  settings?: {
    config?: any
    pipedream?: any[]
    tools?: any[]
    files?: any[]
    builtInTools?: any
    optionalFields?: any[]
    mcp_servers?: any[]
  }
}

interface Usage {
  total_tokens: number
  total_cost: number
  requests_count: number
  period: string
}

interface HealthCheckResponse {
  status: string
  timestamp: string
  version?: string
}

interface ChatCompletionPayload {
  model: string
  messages: Array<{
    role: string
    content: string
  }>
  max_tokens?: number
  temperature?: number
  stream?: boolean
}

interface JsonFormatterPayload {
  jsonString: string
}

interface AiStoreState {
  // Loading states
  loading: boolean
  appLoading: boolean
  pageLoading: boolean

  // API and authentication
  api: any
  user: User | null
  authToken: string | null
  isAdmin: boolean

  // Models and AI
  models: Model[] | null
  selectedModel: Model | null
  userModels: Model[]
  responseId: string | null

  // Agents
  selectedAgent: Agent | null

  // API Keys
  apiKeys: ApiKey[]
  selectedApiKey: ApiKey | null

  // Theme
  themeColor: string

  // Usage and balance
  usage: Usage | null

  // Actions
  setLoading: (loading: boolean) => void
  setAppLoading: (appLoading: boolean) => void
  setPageLoading: (pageLoading: boolean) => void
  setApi: () => void
  getApi: () => any
  setUser: (user: User | null) => void
  getUser: () => User | null
  setAuthToken: (token: string | null) => void
  getAuthToken: () => string | null
  setIsAdmin: (isAdmin: boolean) => void
  setModels: (models: Model[] | null) => void
  getModels: () => Model[] | null
  setSelectedModel: (model: Model | null) => void
  getSelectedModel: () => Model | null
  setResponseId: (responseId: string | null) => void
  setSelectedAgent: (agent: Agent | null) => void
  getSelectedAgent: () => Agent | null
  setUserModels: (models: Model[]) => void
  setApiKeys: (apiKeys: ApiKey[]) => void
  setSelectedApiKey: (apiKey: ApiKey | null) => void
  setThemeColor: (color: string) => void
  setUsage: (usage: Usage | null) => void
  getUsage: () => Usage | null

  // API operations
  healthCheck: () => Promise<HealthCheckResponse>
  loadApiKeys: (authToken: string) => Promise<ApiKey[]>
  addApiKey: (apiKey: ApiKey) => void
  updateApiKey: (id: string, updates: Partial<ApiKey>) => void
  removeApiKey: (id: string) => void
  generateAndUpdateApiKey: (isLogin?: boolean, session?: any, user?: User | null) => Promise<any>
  getUserBalance: () => Promise<number | null>
  formatJson: (jsonString: string, authToken: string) => Promise<any>
  chatCompletions: (payload: ChatCompletionPayload, authToken: string) => Promise<any>
}

const useAiStoreBase = create<AiStoreState>((set, get) => ({
  // Initial state
  loading: false,
  appLoading: true,
  pageLoading: false,
  api: null,
  user: null,
  authToken: null,
  isAdmin: false,
  models: null,
  selectedModel: null,
  responseId: null,
  selectedAgent: null,
  userModels: [],
  apiKeys: [],
  selectedApiKey: null,
  themeColor: 'cyan',
  usage: null,

  // Basic setters
  setLoading: (loading) => set({ loading }),
  setAppLoading: (appLoading) => set({ appLoading }),
  setPageLoading: (pageLoading) => set({ pageLoading }),
  setUser: (user) => set({ user }),
  setAuthToken: (authToken) => set({ authToken }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setModels: (models) => set({ models }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setResponseId: (responseId) => set({ responseId }),
  setSelectedAgent: (selectedAgent) => set({ selectedAgent }),
  setUserModels: (userModels) => set({ userModels }),
  setApiKeys: (apiKeys) => set({ apiKeys }),
  setSelectedApiKey: (selectedApiKey) => set({ selectedApiKey }),
  setThemeColor: (themeColor) => set({ themeColor }),
  setUsage: (usage) => set({ usage }),

  // Getters
  getApi: () => get().api,
  getUser: () => get().user,
  getAuthToken: () => get().authToken,
  getModels: () => get().models,
  getSelectedModel: () => get().selectedModel,
  getSelectedAgent: () => get().selectedAgent,
  getUsage: () => get().usage,

  // API initialization
  setApi: () => set({ api: createBrowserClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY) }),

  // API operations
  healthCheck: async (): Promise<HealthCheckResponse> => {
    const response = await fetchGet({ endpoint: `${endpoint}/healthcheck`, showNotifications: false })
    return response
  },

  loadApiKeys: async (authToken: string): Promise<ApiKey[]> => {
    try {
      const data = await fetchGet({
        endpoint: `${endpoint}/account/apikeys`,
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const apiKeys = data.data || []
      get().setApiKeys(apiKeys)
      return apiKeys
    } catch (error) {
      console.error('Error loading API keys:', error)
      return []
    }
  },

  addApiKey: (apiKey: ApiKey): void => {
    const { apiKeys } = get()
    get().setApiKeys([apiKey, ...apiKeys])
  },

  updateApiKey: (id: string, updates: Partial<ApiKey>): void => {
    const { apiKeys } = get()
    get().setApiKeys(apiKeys.map((key) => (key.id === id ? { ...key, ...updates } : key)))
  },

  removeApiKey: (id: string): void => {
    const { apiKeys } = get()
    get().setApiKeys(apiKeys.filter((key) => key.id !== id))
  },

  generateAndUpdateApiKey: async (isLogin = false, session: any = null, user: User | null = null): Promise<any> => {
    try {
      // Call external API using fetchPost
      const response = await fetchPost({
        endpoint: `${endpoint}/auth/create-token`,
        body: {},
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${isLogin ? session?.access_token : user?.access_token}`,
        },
        showNotifications: false,
      })
      const apiKey = response?.data?.token

      // Update user profile with new API key
      const { data, error } = await get().getApi().from('user_profiles').upsert({ api_key: apiKey, user_id: user?.id }, { onConflict: 'user_id' }).select().single()
      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
        return null
      }

      // Return the updated profile data
      get().setAuthToken(data.api_key)
      return data
    } catch (error) {
      console.error('Error generating API key:', error)
      showNotification({ title: 'Error', message: 'Failed to generate API key', type: 'error' })
      return null
    }
  },

  getUserBalance: async (): Promise<number | null> => {
    const { api, user } = get()
    if (!user?.id) return null
    const { data, error } = await api.from('user_profiles').select('balance').eq('user_id', user.id).single()
    if (error) {
      console.error('Error getting user balance:', error)
      return null
    }
    return data.balance
  },

  formatJson: async (jsonString: string, authToken: string): Promise<any> => {
    const response = await fetchPost({
      endpoint: `${endpoint}/utils/json-formatter`,
      body: { jsonString },
      headers: { Authorization: `Bearer ${authToken}` },
    })
    return response
  },

  chatCompletions: async (payload: ChatCompletionPayload, authToken: string): Promise<any> => {
    const response = await fetchPost({
      endpoint: `${endpoint}/utils/chat-completions`,
      body: payload,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      showNotifications: false,
    })
    return response
  },
}))

export default createUniversalSelectors(useAiStoreBase)
export type { Agent, AiStoreState, ApiKey, ChatCompletionPayload, HealthCheckResponse, JsonFormatterPayload, Model, Usage, User }
