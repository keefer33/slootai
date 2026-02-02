import { showNotification } from '@mantine/notifications'
import { createFrontendClient } from '@pipedream/sdk/browser'
import { create } from 'zustand'
import { endpoint, fetchGet, fetchPost, showError, supabase } from '../utils'
import { type Tool as SlootTool } from './toolsStore'
import createUniversalSelectors from './universalSelectors'

interface PipedreamApp {
  id: string
  name: string
  nameSlug: string
  description: string
  imgSrc?: string
  categories: string[]
  actions: any[]
  configurableProps: any[]
}

interface PipedreamAccount {
  id: string
  name: string
  externalId: string
  healthy: boolean
  app: PipedreamApp
  createdAt: string
  updatedAt: string
}

interface PipedreamAccountsResponse {
  pageInfo: {
    totalCount: number
    count: number
    startCursor: string
    endCursor: string
  }
  data: PipedreamAccount[]
}

interface PipedreamTool {
  id: string
  user_id: string
  tool_name: string
  schema: any
  is_sloot: boolean
  is_pipedream: boolean
  pipedream: any
  avatar?: string
  created_at?: string
  updated_at?: string
}

interface PipedreamState {
  // State
  apps: PipedreamApp[]
  pageInfo: any
  memberApps: PipedreamAccountsResponse
  selectedApp: PipedreamApp | null
  selectedAccount: PipedreamAccount | null
  tools: PipedreamTool[]
  error: string | null
  loading: boolean
  isConnected: boolean
  accountId: string | null
  selectedComponent: any | null
  hasMoreData: boolean

  // Actions
  setApps: (apps: PipedreamApp[]) => void
  setPageInfo: (pageInfo: any) => void
  setMemberApps: (data: PipedreamAccountsResponse) => void
  setSelectedApp: (app: PipedreamApp | null) => void
  setSelectedAccount: (account: PipedreamAccount | null) => void
  setTools: (tools: PipedreamTool[]) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  setIsConnected: (isConnected: boolean) => void
  setAccountId: (accountId: string | null) => void
  setSelectedComponent: (component: any | null) => void
  setHasMoreData: (hasMoreData: boolean) => void

  // Getters
  getApps: () => PipedreamApp[]
  getPageInfo: () => any
  getMemberApps: () => PipedreamAccountsResponse
  getSelectedApp: () => PipedreamApp | null
  getSelectedAccount: () => PipedreamAccount | null
  getTools: () => PipedreamTool[]
  getIsConnected: () => boolean
  getAccountId: () => string | null
  getSelectedComponent: () => any | null
  getHasMoreData: () => boolean

  // Utility functions
  getPipedreamApps: (q: string, authToken: string) => Promise<any>
  connectAccount: (userId: string, checkButtonState: (status: boolean) => void, authToken: string) => Promise<void>
  deleteAccount: (accountId: string, userId: string, checkButtonState: (status: boolean) => void, authToken: string) => Promise<boolean>
  handleCreateTool: (app: any, userId: string, authToken: string) => Promise<void>
  createTool: (tool: SlootTool) => Promise<SlootTool>
  transformPipedreamToTool: (pipedreamComponent: any) => any
  runPipedreamAction: (payload: any, authToken: string) => Promise<any>
  getToolIdFromPipedream: (toolName: string, userId: string) => Promise<string>
  getAccountList: (userId: string, authToken: string) => Promise<void>

  init: (appSlug: string) => Promise<void>
  getAppBySlug: (appSlug: string, authToken: string) => Promise<void>
  reset: () => void
}

const usePipedreamStoreBase = create<PipedreamState>((set, get: any) => ({
  // Initial state
  apps: [],
  pageInfo: null,
  memberApps: { pageInfo: { totalCount: 0, count: 0, startCursor: '', endCursor: '' }, data: [] },
  selectedApp: null,
  selectedAccount: null,
  tools: [],
  error: null,
  loading: false,
  isConnected: false,
  accountId: null,
  selectedComponent: null,
  hasMoreData: false,

  // Basic setters
  setApps: (apps) => set({ apps: apps }),
  setPageInfo: (pageInfo) => set({ pageInfo }),
  setMemberApps: (apps) => set({ memberApps: apps }),
  setSelectedApp: (app) => set({ selectedApp: app }),
  setSelectedAccount: (account) => set({ selectedAccount: account }),
  setTools: (tools) => set({ tools }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setAccountId: (accountId) => set({ accountId }),
  setSelectedComponent: (component) => set({ selectedComponent: component }),
  setHasMoreData: (hasMoreData) => set({ hasMoreData }),

  // Getters
  getApps: () => get().apps,
  getPageInfo: () => get().pageInfo,
  getMemberApps: () => get().memberApps,
  getSelectedApp: () => get().selectedApp,
  getSelectedAccount: () => get().selectedAccount,
  getTools: () => get().tools,
  getIsConnected: () => get().isConnected,
  getAccountId: () => get().accountId,
  getSelectedComponent: () => get().selectedComponent,
  getHasMoreData: () => get().hasMoreData,

  // utility
  // Utility functions
  getPipedreamApps: async (q: string, authToken: string) => {
    const searchParams = new URLSearchParams(q)
    const searchQuery = searchParams.get('q') || ''
    const after = searchParams.get('after') || ''
    const query = searchQuery.length > 0 ? q : after.length > 2 ? `?after=${after}` : ''
    const apps = await fetchGet({ endpoint: `${endpoint}/pipedream/apps${query}`, headers: { Authorization: `Bearer ${authToken}` }, showNotifications: false })
    set({ apps: [...get().apps, ...apps.data] })
    set({ pageInfo: apps.pageInfo })
    // Set hasMoreData based on initial load
    const pageInfo = get().pageInfo
    if (pageInfo) {
      const hasMore = pageInfo.count < pageInfo.totalCount
      set({ hasMoreData: hasMore })
    }
    return apps || []
  },

  init: async (appSlug: string) => {
    set({ isConnected: false })

    const account = get().memberApps?.data?.find((app) => app.app.nameSlug === appSlug)
    if (account) {
      set({ selectedAccount: account })
      set({ accountId: account?.id })
      set({ isConnected: true })
    }
  },

  getAccountList: async (userId: string, authToken: string) => {
    const apps = await fetchPost({
      endpoint: `${endpoint}/pipedream/accounts/list`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { userId: userId },
      showNotifications: false,
    })
    set({ memberApps: apps })
  },

  getAppBySlug: async (appSlug: string, authToken: string) => {
    const account = await fetchGet({ endpoint: `${endpoint}/pipedream/app/${appSlug}`, headers: { Authorization: `Bearer ${authToken}` }, showNotifications: false })
    set({ selectedApp: account })
  },

  connectAccount: async (userId: string, checkButtonState: (status: boolean) => void, authToken: string) => {
    try {
      const token = await fetchGet({ endpoint: `${endpoint}/pipedream/connect/token`, headers: { Authorization: `Bearer ${authToken}` }, showNotifications: false })

      const client = createFrontendClient({
        externalUserId: userId,
        tokenCallback: async () => token.token,
      })
      client.connectAccount({
        app: get().selectedApp?.nameSlug,
        token: token.token,
        onSuccess: async (account) => {
          // Handle successful connection
          const apps = await fetchPost({
            endpoint: `${endpoint}/pipedream/accounts/list`,
            headers: { Authorization: `Bearer ${authToken}` },
            body: { userId: userId },
            showNotifications: false,
          })
          const app = apps?.data?.find((app) => app.id === account.id)
          await get().handleCreateTool(app, userId, authToken)
          set({ memberApps: apps })
          set({ selectedAccount: app })
          set({ accountId: app.id })
          set({ isConnected: true })
          checkButtonState(true)
        },
        onError: (err) => {
          // Handle connection error
          console.error(`Connection error: ${err.message}`)
        },
      })
    } catch (err: any) {
      console.error('Connection error:', err)
      showNotification({
        title: 'Error',
        message: `Connection error: ${err.message}`,
        color: 'red',
      })
    }
  },

  handleCreateTool: async (app: any, userId: string, authToken: string) => {
    try {
      let actions: any[] = []
      if (get().selectedApp?.actions) {
        actions = get().selectedApp?.actions
      } else {
        const selectedApp = await fetchGet({
          endpoint: `${endpoint}/pipedream/app/${app.app.nameSlug}`,
          headers: { Authorization: `Bearer ${authToken}` },
          showNotifications: false,
        })
        actions = selectedApp?.actions
      }
      actions.forEach(async (component: any) => {
        const transformedTool = get().transformPipedreamToTool(component)
        // Create a copy to avoid mutating the original
        const memberAppWithType = { ...app, appType: transformedTool.appType }
        // Create the tool object for the database
        const toolData: Partial<SlootTool> = {
          user_id: userId,
          tool_name: transformedTool.name,
          schema: {
            name: transformedTool.name,
            description: transformedTool.description,
            inputSchema: transformedTool.inputSchema,
          },
          is_sloot: false, // Set to true if you want it to be an admin tool
          is_pipedream: true,
          pipedream: memberAppWithType, // Use the copy with appType
          avatar: app?.app?.imgSrc,
        }

        await get().createTool(toolData as SlootTool)
      })
    } catch (error) {
      console.error('Error creating tool:', error)
      showNotification({
        title: 'Error',
        message: error instanceof Error ? error.message : 'An error occurred while creating the tool',
        color: 'red',
      })
    }
  },

  createTool: async (tool: SlootTool) => {
    const { data, error } = await supabase.from('user_tools').insert(tool).select().single()
    if (error) {
      showError(error)
      return false
    }
    return data
  },

  deleteAccount: async (accountId: string, userId: string, checkButtonState: (status: boolean) => void, authToken: string) => {
    await fetchPost({
      endpoint: `${endpoint}/pipedream/account/delete`,
      body: { accountId: accountId },
      headers: { Authorization: `Bearer ${authToken}` },
      showNotifications: false,
    })
    await get().deletePipedreamTools(accountId)
    get().setAccountId(null)
    get().setIsConnected(false)
    const apps = await fetchPost({
      endpoint: `${endpoint}/pipedream/accounts/list`,
      body: { userId: userId },
      headers: { Authorization: `Bearer ${authToken}` },
      showNotifications: false,
    })
    get().setMemberApps(apps)
    checkButtonState(false)
    return true
  },

  deletePipedreamTools: async (accountId: string) => {
    const { error } = await supabase.from('user_tools').delete().eq('pipedream->>id', accountId)
    if (error) {
      return error
    }
    return true
  },

  transformPipedreamToTool: (pipedreamComponent: any) => {
    const { key, description, configurableProps } = pipedreamComponent

    // Transform configurable_props to inputSchema properties
    const properties: any = {}
    const required: string[] = []
    let typeApp: any = {}

    if (!configurableProps || !Array.isArray(configurableProps)) {
    } else {
      configurableProps.forEach((prop: any) => {
        // Skip app type props as they're typically for authentication
        if (prop.type === 'app') {
          typeApp = prop
          return
        }

        const property: any = {
          description: prop.description || `${prop.label || prop.name} parameter`,
        }

        // If the property has options, it means it has predefined choices
        if (prop.options && Array.isArray(prop.options)) {
          property.type = 'string'
          property.enum = prop.options
        } else {
          // Regular type mapping for properties without predefined options
          property.type = prop.type === 'boolean' ? 'boolean' : prop.type === 'integer' ? 'integer' : prop.type === 'number' ? 'number' : 'string'
        }

        // Add default value if available
        if (prop.default !== undefined) {
          property.default = prop.default
        }

        // Add label if available
        if (prop.label) {
          property.title = prop.label
        }

        properties[prop.name] = property

        // Add to required array if not optional
        if (!prop.optional) {
          required.push(prop.name)
        }
      })
    }

    const transformedTool = {
      appType: typeApp,
      name: key,
      description: description,
      inputSchema: {
        type: 'object',
        properties,
        required,
      },
    }

    return transformedTool
  },

  runPipedreamAction: async (payload: any, authToken: string) => {
    const action = await fetchPost({
      endpoint: `${endpoint}/pipedream/run`,
      body: { payload: payload },
      headers: { Authorization: `Bearer ${authToken}` },
      showNotifications: false,
    })
    return action
  },

  getToolIdFromPipedream: async (toolName: string, userId: string) => {
    const { error, data } = await supabase.from('user_tools').select('id').eq('user_id', userId).eq('tool_name', toolName).single()
    if (error) {
      return error
    }
    return data.id
  },

  reset: () =>
    set({
      apps: [],
      pageInfo: null,
      memberApps: { pageInfo: { totalCount: 0, count: 0, startCursor: '', endCursor: '' }, data: [] },
      selectedApp: null,
      selectedAccount: null,
      tools: [],
      error: null,
      loading: false,
      isConnected: false,
      accountId: null,
      selectedComponent: null,
      hasMoreData: false,
    }),
}))

export default createUniversalSelectors(usePipedreamStoreBase)
export type { PipedreamAccount, PipedreamAccountsResponse, PipedreamApp, PipedreamTool }
