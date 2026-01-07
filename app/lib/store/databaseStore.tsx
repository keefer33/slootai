import { createBrowserClient } from '@supabase/ssr'
import { create } from 'zustand'
import { endpoint, fetchDelete, fetchGet, fetchPatch, fetchPost } from '../utils'

// Database Types
export interface DatabaseTemplate {
  id: string
  name: string
  description: string
  logo: string
  home_url: string
}

export interface UserDatabase {
  id: string
  created_at?: string
  user_id?: string
  database_uuid?: string
  type?: string
  public_port?: number
  external_db_url?: string
  internal_db_url?: string
  config?: any
  response?: any
}

export interface CreateDatabaseRequest {
  type: string
  name: string
  description?: string
  public_port?: number
  external_db_url?: string
  internal_db_url?: string
  config?: any
  response?: any
  // PostgreSQL fields
  postgres_user?: string
  postgres_password?: string
  postgres_db?: string
  postgres_initdb_args?: string
  postgres_host_auth_method?: string
  postgres_conf?: string
  // MongoDB fields
  mongo_conf?: string
  mongo_initdb_root_username?: string
  // ClickHouse fields
  clickhouse_admin_user?: string
  clickhouse_admin_password?: string
  // DragonFly fields
  dragonfly_password?: string
  // Redis fields
  redis_password?: string
  redis_conf?: string
  // KeyDB fields
  keydb_password?: string
  keydb_conf?: string
  // MariaDB fields
  mariadb_conf?: string
  mariadb_root_password?: string
  mariadb_user?: string
  mariadb_password?: string
  mariadb_database?: string
  // MySQL fields
  mysql_root_password?: string
  mysql_password?: string
  mysql_user?: string
  mysql_database?: string
  mysql_conf?: string
}

interface DatabaseStore {
  // Database Templates
  databaseTemplates: DatabaseTemplate[]
  templatesLoading: boolean
  selectedTemplate: DatabaseTemplate | null

  // User Databases
  databases: UserDatabase[]
  loading: boolean

  // Modals
  createModalOpened: boolean
  editModalOpened: boolean
  deleteModalOpened: boolean
  selectedDatabase: UserDatabase | null

  // Polling state
  pollingDatabaseUuid: string | null
  currentPollingDatabase: UserDatabase | null
  pollingInterval: NodeJS.Timeout | null

  // Template Actions
  setDatabaseTemplates: (templates: DatabaseTemplate[]) => void
  setTemplatesLoading: (loading: boolean) => void
  setSelectedTemplate: (template: DatabaseTemplate | null) => void
  loadDatabaseTemplates: () => void

  // Database Actions
  setDatabases: (databases: UserDatabase[]) => void
  setLoading: (loading: boolean) => void
  loadDatabases: (authToken: string) => Promise<void>
  getDatabase: (id: string, authToken: string) => Promise<UserDatabase | null>
  getDatabaseById: (id: string, authToken: string) => Promise<UserDatabase | null>
  startDatabase: (uuid: string, authToken: string) => Promise<boolean>
  stopDatabase: (uuid: string, authToken: string) => Promise<boolean>
  restartDatabase: (uuid: string, authToken: string) => Promise<boolean>
  createDatabase: (databaseData: CreateDatabaseRequest, authToken: string) => Promise<UserDatabase | null>
  updateDatabase: (id: string, databaseData: Partial<CreateDatabaseRequest>, authToken: string) => Promise<boolean>
  updateDatabaseViaCoolify: (uuid: string, databaseData: any, authToken: string) => Promise<boolean>
  deleteDatabase: (id: string, authToken: string) => Promise<boolean>

  // Polling Actions
  startPolling: (databaseUuid: string, authToken: string) => void
  stopPolling: () => void
  updatePollingDatabase: (database: UserDatabase) => void

  // Modal Actions
  setCreateModalOpened: (opened: boolean) => void
  setEditModalOpened: (opened: boolean) => void
  setDeleteModalOpened: (opened: boolean) => void
  setSelectedDatabase: (database: UserDatabase | null) => void

  // Reset
  resetState: () => void

  // Utility functions
  filterDatabaseDataByType: (data: CreateDatabaseRequest, dbType: string) => any
}

export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
  // Database Templates
  databaseTemplates: [],
  templatesLoading: false,
  selectedTemplate: null,

  // User Databases
  databases: [],
  loading: false,

  // Modals
  createModalOpened: false,
  editModalOpened: false,
  deleteModalOpened: false,
  selectedDatabase: null,

  // Polling state
  pollingDatabaseUuid: null,
  currentPollingDatabase: null,
  pollingInterval: null,

  // Template Actions
  setDatabaseTemplates: (templates) => set({ databaseTemplates: templates }),
  setTemplatesLoading: (loading) => set({ templatesLoading: loading }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  loadDatabaseTemplates: async () => {
    set({ templatesLoading: true })
    try {
      const supabase = createBrowserClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

      const { data, error } = await supabase.from('cloud_databases').select('*').order('name')

      if (error) {
        console.error('Error loading database templates:', error)
        set({ templatesLoading: false })
        return
      }

      set({ databaseTemplates: data || [], templatesLoading: false })
    } catch (error) {
      console.error('Error loading database templates:', error)
      set({ templatesLoading: false })
    }
  },

  // Database Actions
  setDatabases: (userDatabases) => set({ databases: userDatabases }),
  setLoading: (loading) => set({ loading }),
  loadDatabases: async (authToken) => {
    set({ loading: true })
    try {
      const response = await fetchGet({
        endpoint: `${endpoint}/coolify/user-databases`,
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.success) {
        set({ databases: response.data })
      }
    } catch (error) {
      console.error('Error loading databases:', error)
    } finally {
      set({ loading: false })
    }
  },
  getDatabase: async (id, authToken) => {
    try {
      const response = await fetchGet({
        endpoint: `${endpoint}/coolify/databases/${id}`,
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.success) {
        return response.data
      }
      return null
    } catch (error) {
      console.error('Error loading database:', error)
      return null
    }
  },
  getDatabaseById: async (id, authToken) => {
    try {
      // First get the Supabase database info using the user-databases/:id route
      const response = await fetch(`${endpoint}/coolify/user-databases/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const supabaseData = await response.json()
        if (supabaseData.success && supabaseData.data?.database_uuid) {
          // Now get the full Coolify database data using the UUID
          const coolifyData = await get().getDatabase(supabaseData.data.database_uuid, authToken)
          if (coolifyData) {
            // Return the Coolify data with the database_uuid and type for polling
            return {
              ...coolifyData,
              database_uuid: supabaseData.data.database_uuid,
              id: supabaseData.data.id,
              type: supabaseData.data.type, // Preserve the type from Supabase data
            }
          }
        }
      }
      return null
    } catch (error) {
      console.error('Error loading database by ID:', error)
      return null
    }
  },
  startDatabase: async (uuid, authToken) => {
    try {
      const response = await fetchPost({
        endpoint: `${endpoint}/coolify/databases/${uuid}/start`,
        body: {},
        headers: { Authorization: `Bearer ${authToken}` },
      })
      return response.success
    } catch (error) {
      console.error('Error starting database:', error)
      return false
    }
  },
  stopDatabase: async (uuid, authToken) => {
    try {
      const response = await fetchPost({
        endpoint: `${endpoint}/coolify/databases/${uuid}/stop`,
        body: {},
        headers: { Authorization: `Bearer ${authToken}` },
      })
      return response.success
    } catch (error) {
      console.error('Error stopping database:', error)
      return false
    }
  },
  restartDatabase: async (uuid, authToken) => {
    try {
      const response = await fetchPost({
        endpoint: `${endpoint}/coolify/databases/${uuid}/restart`,
        body: {},
        headers: { Authorization: `Bearer ${authToken}` },
      })
      return response.success
    } catch (error) {
      console.error('Error restarting database:', error)
      return false
    }
  },
  createDatabase: async (databaseData, authToken) => {
    try {
      // Route to specific database creation endpoint based on type
      const dbType = databaseData.type.toLowerCase()
      let createEndpoint = ''

      switch (dbType) {
        case 'postgresql':
          createEndpoint = `${endpoint}/coolify/databases/postgresql`
          break
        case 'mongodb':
          createEndpoint = `${endpoint}/coolify/databases/mongodb`
          break
        case 'clickhouse':
          createEndpoint = `${endpoint}/coolify/databases/clickhouse`
          break
        case 'dragonfly':
          createEndpoint = `${endpoint}/coolify/databases/dragonfly`
          break
        case 'redis':
          createEndpoint = `${endpoint}/coolify/databases/redis`
          break
        case 'keydb':
          createEndpoint = `${endpoint}/coolify/databases/keydb`
          break
        case 'mariadb':
          createEndpoint = `${endpoint}/coolify/databases/mariadb`
          break
        case 'mysql':
          createEndpoint = `${endpoint}/coolify/databases/mysql`
          break
        default:
          console.error('Unknown database type:', dbType)
          return false
      }

      // Filter the data to only include fields relevant to the specific database type
      const filteredData = get().filterDatabaseDataByType(databaseData, dbType)

      const response = await fetchPost({
        endpoint: createEndpoint,
        body: filteredData,
        headers: { Authorization: `Bearer ${authToken}` },
      })
      console.log('Database creation response:', response)
      if (response.success) {
        // Reload databases after creation
        await get().loadDatabases(authToken)
        // Return the created database from the response
        console.log('Database record from response:', response.database_record)
        return response.database_record || null
      }
      return null
    } catch (error) {
      console.error('Error creating database:', error)
      return null
    }
  },
  updateDatabase: async (id, databaseData, authToken) => {
    try {
      const response = await fetchPatch({
        endpoint: `${endpoint}/coolify/user-databases/${id}`,
        body: databaseData,
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.success) {
        // Reload databases after update
        await get().loadDatabases(authToken)
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating database:', error)
      return false
    }
  },
  updateDatabaseViaCoolify: async (uuid, databaseData, authToken) => {
    try {
      const response = await fetchPatch({
        endpoint: `${endpoint}/coolify/databases/${uuid}`,
        body: databaseData,
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.success) {
        // Reload databases after update
        await get().loadDatabases(authToken)
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating database via Coolify:', error)
      return false
    }
  },
  deleteDatabase: async (id, authToken) => {
    try {
      const response = await fetchDelete({
        endpoint: `${endpoint}/coolify/databases/${id}`,
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.success) {
        // Reload databases after deletion
        await get().loadDatabases(authToken)
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting database:', error)
      return false
    }
  },

  // Polling Actions
  startPolling: (databaseUuid, authToken) => {
    const state = get()

    // Stop any existing polling
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval)
    }

    // Set the polling database UUID
    set({ pollingDatabaseUuid: databaseUuid })

    // Start polling every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetchGet({
          endpoint: `${endpoint}/coolify/databases/${databaseUuid}`,
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (response.success) {
          set({ currentPollingDatabase: response.data })
        }
      } catch (error) {
        console.error('Error polling database status:', error)
      }
    }, 5000)

    set({ pollingInterval: interval })
  },

  stopPolling: () => {
    const state = get()
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval)
    }
    set({
      pollingDatabaseUuid: null,
      currentPollingDatabase: null,
      pollingInterval: null,
    })
  },

  updatePollingDatabase: (database) => {
    set({ currentPollingDatabase: database })
  },

  // Modal Actions
  setCreateModalOpened: (opened) => set({ createModalOpened: opened }),
  setEditModalOpened: (opened) => set({ editModalOpened: opened }),
  setDeleteModalOpened: (opened) => set({ deleteModalOpened: opened }),
  setSelectedDatabase: (database) => set({ selectedDatabase: database }),

  // Reset
  resetState: () => {
    const state = get()
    // Stop polling if active
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval)
    }
    set({
      databaseTemplates: [],
      templatesLoading: false,
      selectedTemplate: null,
      databases: [],
      loading: false,
      createModalOpened: false,
      editModalOpened: false,
      deleteModalOpened: false,
      selectedDatabase: null,
      pollingDatabaseUuid: null,
      currentPollingDatabase: null,
      pollingInterval: null,
    })
  },

  // Filter database data to only include fields relevant to the specific database type
  filterDatabaseDataByType: (data, dbType) => {
    const baseFields = {
      name: data.name,
      description: data.description,
      type: data.type,
    }

    // Helper function to filter out empty/undefined fields
    const filterEmptyFields = (obj) => {
      const filtered = {}
      Object.keys(obj).forEach((key) => {
        const value = obj[key]
        if (value !== undefined && value !== null && value !== '') {
          filtered[key] = value
        }
      })
      return filtered
    }

    switch (dbType) {
      case 'postgresql':
        return filterEmptyFields({
          ...baseFields,
          postgres_user: data.postgres_user,
          postgres_password: data.postgres_password,
          postgres_db: data.postgres_db,
          postgres_initdb_args: data.postgres_initdb_args,
          postgres_host_auth_method: data.postgres_host_auth_method,
          postgres_conf: data.postgres_conf,
        })

      case 'mongodb':
        return filterEmptyFields({
          ...baseFields,
          mongo_conf: data.mongo_conf,
          mongo_initdb_root_username: data.mongo_initdb_root_username,
        })

      case 'clickhouse':
        return filterEmptyFields({
          ...baseFields,
          clickhouse_admin_user: data.clickhouse_admin_user,
          clickhouse_admin_password: data.clickhouse_admin_password,
        })

      case 'dragonfly':
        return filterEmptyFields({
          ...baseFields,
          dragonfly_password: data.dragonfly_password,
        })

      case 'redis':
        return filterEmptyFields({
          ...baseFields,
          redis_password: data.redis_password,
          redis_conf: data.redis_conf,
        })

      case 'keydb':
        return filterEmptyFields({
          ...baseFields,
          keydb_password: data.keydb_password,
          keydb_conf: data.keydb_conf,
        })

      case 'mariadb':
        return filterEmptyFields({
          ...baseFields,
          mariadb_conf: data.mariadb_conf,
          mariadb_root_password: data.mariadb_root_password,
          mariadb_user: data.mariadb_user,
          mariadb_password: data.mariadb_password,
          mariadb_database: data.mariadb_database,
        })

      case 'mysql':
        return filterEmptyFields({
          ...baseFields,
          mysql_root_password: data.mysql_root_password,
          mysql_password: data.mysql_password,
          mysql_user: data.mysql_user,
          mysql_database: data.mysql_database,
          mysql_conf: data.mysql_conf,
        })

      default:
        return baseFields
    }
  },
}))
