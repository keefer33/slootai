import { createBrowserClient } from '@supabase/ssr'
import { create } from 'zustand'
import { showNotification } from '../notificationUtils'
import { endpoint, fetchDelete, fetchGet, fetchPatch, fetchPost } from '../utils'
import createUniversalSelectors from './universalSelectors'

// Cloud Service Types
export interface CloudService {
  id: string
  user_id?: string
  service_id?: string
  domain?: string
  type?: string
  config?: any
  response?: any
  env?: any
  created_at?: string
  updated_at?: string
  cloud_services_id?: string
  // Related cloud service template data
  cloud_service?: {
    id: string
    name: string
    type: string
    description: string | null
    category: string | null
    tags: string[] | null
    home_url: string | null
    logo: string | null
    created_at: string
  }
}

// Database Cloud Service Template Types
export interface CloudServiceTemplate {
  id: string
  name: string
  type: string
  description: string | null
  category: string | null
  tags: string[] | null
  home_url: string | null
  logo: string | null
  created_at: string
}

export interface CreateServiceRequest {
  type: string
  name: string
  description?: string
  project_uuid?: string
  environment_name?: string
  environment_uuid?: string
  server_uuid?: string
  destination_uuid?: string
  instant_deploy?: boolean
  docker_compose_raw?: string
  cloud_services_id?: string
}

export interface ServiceEnvironment {
  id: string
  key: string
  value: string
  is_secret?: boolean
  created_at?: string
  updated_at?: string
}

export interface CloudState {
  // State
  loading: boolean
  services: CloudService[]
  selectedService: CloudService | null
  serviceEnvironments: ServiceEnvironment[]
  environmentsLoading: boolean

  // Cloud Service Templates (from database)
  serviceTemplates: CloudServiceTemplate[]
  templatesLoading: boolean
  selectedTemplate: CloudServiceTemplate | null

  // Modal states
  createModalOpened: boolean
  editModalOpened: boolean
  deleteModalOpened: boolean
  envModalOpened: boolean

  // Form states
  creating: boolean
  updating: boolean
  deleting: boolean

  // Error handling
  error: string | null

  // Actions
  setLoading: (loading: boolean) => void
  setServices: (services: CloudService[]) => void
  setSelectedService: (service: CloudService | null) => void
  setServiceEnvironments: (environments: ServiceEnvironment[]) => void
  setEnvironmentsLoading: (loading: boolean) => void

  // Template actions
  setServiceTemplates: (templates: CloudServiceTemplate[]) => void
  setTemplatesLoading: (loading: boolean) => void
  setSelectedTemplate: (template: CloudServiceTemplate | null) => void

  // Modal actions
  setCreateModalOpened: (opened: boolean) => void
  setEditModalOpened: (opened: boolean) => void
  setDeleteModalOpened: (opened: boolean) => void
  setEnvModalOpened: (opened: boolean) => void

  // Form actions
  setCreating: (creating: boolean) => void
  setUpdating: (updating: boolean) => void
  setDeleting: (deleting: boolean) => void
  setError: (error: string | null) => void

  // Getters
  getLoading: () => boolean
  getServices: () => CloudService[]
  getSelectedService: () => CloudService | null
  getServiceEnvironments: () => ServiceEnvironment[]
  getEnvironmentsLoading: () => boolean
  getServiceTemplates: () => CloudServiceTemplate[]
  getTemplatesLoading: () => boolean
  getSelectedTemplate: () => CloudServiceTemplate | null
  getCreateModalOpened: () => boolean
  getEditModalOpened: () => boolean
  getDeleteModalOpened: () => boolean
  getEnvModalOpened: () => boolean
  getCreating: () => boolean
  getUpdating: () => boolean
  getDeleting: () => boolean
  getError: () => string | null

  // CRUD Operations
  loadServices: (authToken: string) => Promise<void>
  createService: (serviceData: CreateServiceRequest, authToken: string) => Promise<CloudService | null>
  updateService: (serviceId: string, updates: Partial<CloudService>, authToken: string) => Promise<CloudService | null>
  deleteService: (serviceId: string, authToken: string) => Promise<boolean>

  // Template Operations
  loadServiceTemplates: () => Promise<void>

  // Service Control Operations
  startService: (serviceId: string, authToken: string) => Promise<boolean>
  stopService: (serviceId: string, authToken: string) => Promise<boolean>
  restartService: (serviceId: string, authToken: string) => Promise<boolean>

  // Environment Operations
  loadServiceEnvironments: (serviceId: string, authToken: string) => Promise<void>
  createServiceEnvironment: (serviceId: string, envData: { key: string; value: string; is_secret?: boolean }, authToken: string) => Promise<boolean>
  updateServiceEnvironment: (serviceId: string, envId: string, envData: { key: string; value: string; is_secret?: boolean }, authToken: string) => Promise<boolean>
  deleteServiceEnvironment: (serviceId: string, envId: string, authToken: string) => Promise<boolean>
  updateServiceEnvironmentsBulk: (serviceId: string, environments: ServiceEnvironment[], authToken: string) => Promise<boolean>

  // Polling state
  pollingServiceId: string | null
  currentPollingService: CloudService | null
  pollingInterval: NodeJS.Timeout | null

  // Polling Actions
  startPolling: (serviceId: string, authToken: string) => void
  stopPolling: () => void
  updatePollingService: (service: CloudService) => void

  // Utility functions
  resetState: () => void
  refreshServices: (authToken: string) => Promise<void>
  getServiceStatus: (serviceId: string, authToken: string) => Promise<any>
}

const useCloudStoreBase = create<CloudState>((set, get: any) => ({
  // Initial state
  loading: false,
  services: [],
  selectedService: null,
  serviceEnvironments: [],
  environmentsLoading: false,

  // Template state
  serviceTemplates: [],
  templatesLoading: false,
  selectedTemplate: null,

  // Modal states
  createModalOpened: false,
  editModalOpened: false,
  deleteModalOpened: false,
  envModalOpened: false,

  // Form states
  creating: false,
  updating: false,
  deleting: false,

  // Error handling
  error: null,

  // Polling state
  pollingServiceId: null,
  currentPollingService: null,
  pollingInterval: null,

  // Basic setters
  setLoading: (loading) => set({ loading }),
  setServices: (services) => set({ services }),
  setSelectedService: (service) => set({ selectedService: service }),
  setServiceEnvironments: (environments) => set({ serviceEnvironments: environments }),
  setEnvironmentsLoading: (loading) => set({ environmentsLoading: loading }),

  // Template setters
  setServiceTemplates: (templates) => set({ serviceTemplates: templates }),
  setTemplatesLoading: (loading) => set({ templatesLoading: loading }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  // Modal setters
  setCreateModalOpened: (opened) => set({ createModalOpened: opened }),
  setEditModalOpened: (opened) => set({ editModalOpened: opened }),
  setDeleteModalOpened: (opened) => set({ deleteModalOpened: opened }),
  setEnvModalOpened: (opened) => set({ envModalOpened: opened }),

  // Form setters
  setCreating: (creating) => set({ creating }),
  setUpdating: (updating) => set({ updating }),
  setDeleting: (deleting) => set({ deleting }),
  setError: (error) => set({ error }),

  // Getters
  getLoading: () => get().loading,
  getServices: () => get().services,
  getSelectedService: () => get().selectedService,
  getServiceEnvironments: () => get().serviceEnvironments,
  getEnvironmentsLoading: () => get().environmentsLoading,
  getServiceTemplates: () => get().serviceTemplates,
  getTemplatesLoading: () => get().templatesLoading,
  getSelectedTemplate: () => get().selectedTemplate,
  getCreateModalOpened: () => get().createModalOpened,
  getEditModalOpened: () => get().editModalOpened,
  getDeleteModalOpened: () => get().deleteModalOpened,
  getEnvModalOpened: () => get().envModalOpened,
  getCreating: () => get().creating,
  getUpdating: () => get().updating,
  getDeleting: () => get().deleting,
  getError: () => get().error,

  // Load user's cloud services
  loadServices: async (authToken: string) => {
    set({ loading: true, error: null })
    try {
      const response = await fetchGet({
        endpoint: `${endpoint}/coolify/database/services`,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        set({ services: response.data || [] })
      } else {
        set({ error: response.error || 'Failed to load services' })
        showNotification({ title: 'Error', message: response.error || 'Failed to load services', type: 'error' })
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load services'
      set({ error: errorMessage })
      showNotification({ title: 'Error', message: errorMessage, type: 'error' })
    } finally {
      set({ loading: false })
    }
  },

  // Load cloud service templates from database
  loadServiceTemplates: async () => {
    set({ templatesLoading: true, error: null })
    try {
      const supabase = createBrowserClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

      const { data, error } = await supabase.from('cloud_services').select('*').order('name', { ascending: true })

      if (error) {
        console.error('Error fetching cloud services:', error)
        set({ error: error.message || 'Failed to load service templates' })
        showNotification({ title: 'Error', message: error.message || 'Failed to load service templates', type: 'error' })
        return
      }

      set({ serviceTemplates: data || [] })
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load service templates'
      console.error('Error loading service templates:', error)
      set({ error: errorMessage })
      showNotification({ title: 'Error', message: errorMessage, type: 'error' })
    } finally {
      set({ templatesLoading: false })
    }
  },

  // Create a new cloud service
  createService: async (serviceData: CreateServiceRequest, authToken: string) => {
    set({ creating: true, error: null })
    try {
      console.log('Creating service with data:', serviceData)
      const response = await fetchPost({
        endpoint: `${endpoint}/coolify/services/create`,
        body: serviceData,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      console.log('Service creation response:', response)

      if (response.success) {
        showNotification({ title: 'Success', message: 'Service created successfully', type: 'success' })
        // Refresh services list
        await get().loadServices(authToken)
        console.log('Service record from response:', response.database_record)
        return response.database_record
      } else {
        console.log('Service creation failed:', response.error)
        set({ error: response.error || 'Failed to create service' })
        showNotification({ title: 'Error', message: response.error || 'Failed to create service', type: 'error' })
        return null
      }
    } catch (error: any) {
      console.log('Service creation error:', error)
      const errorMessage = error.message || 'Failed to create service'
      set({ error: errorMessage })
      showNotification({ title: 'Error', message: errorMessage, type: 'error' })
      return null
    } finally {
      set({ creating: false })
    }
  },

  // Update a cloud service
  updateService: async (serviceId: string, updates: Partial<CloudService>, authToken: string) => {
    set({ updating: true, error: null })
    try {
      const response = await fetchPatch({
        endpoint: `${endpoint}/coolify/services/${serviceId}/update`,
        body: updates,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        showNotification({ title: 'Success', message: 'Service updated successfully', type: 'success' })
        // Refresh services list
        await get().loadServices(authToken)
        return response.data
      } else {
        set({ error: response.error || 'Failed to update service' })
        showNotification({ title: 'Error', message: response.error || 'Failed to update service', type: 'error' })
        return null
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update service'
      set({ error: errorMessage })
      showNotification({ title: 'Error', message: errorMessage, type: 'error' })
      return null
    } finally {
      set({ updating: false })
    }
  },

  // Delete a cloud service
  deleteService: async (serviceId: string, authToken: string) => {
    set({ deleting: true, error: null })
    try {
      const response = await fetchDelete({
        endpoint: `${endpoint}/coolify/services/${serviceId}/delete`,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        showNotification({ title: 'Success', message: 'Service deleted successfully', type: 'success' })
        // Refresh services list
        await get().loadServices(authToken)
        return true
      } else {
        set({ error: response.error || 'Failed to delete service' })
        showNotification({ title: 'Error', message: response.error || 'Failed to delete service', type: 'error' })
        return false
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete service'
      set({ error: errorMessage })
      showNotification({ title: 'Error', message: errorMessage, type: 'error' })
      return false
    } finally {
      set({ deleting: false })
    }
  },

  // Start a service
  startService: async (serviceId: string, authToken: string) => {
    try {
      const response = await fetchGet({
        endpoint: `${endpoint}/coolify/services/${serviceId}/start`,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        showNotification({ title: 'Success', message: 'Service started successfully', type: 'success' })
        return true
      } else {
        showNotification({ title: 'Error', message: response.error || 'Failed to start service', type: 'error' })
        return false
      }
    } catch (error: any) {
      showNotification({ title: 'Error', message: error.message || 'Failed to start service', type: 'error' })
      return false
    }
  },

  // Stop a service
  stopService: async (serviceId: string, authToken: string) => {
    try {
      const response = await fetchGet({
        endpoint: `${endpoint}/coolify/services/${serviceId}/stop`,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        showNotification({ title: 'Success', message: 'Service stopped successfully', type: 'success' })
        return true
      } else {
        showNotification({ title: 'Error', message: response.error || 'Failed to stop service', type: 'error' })
        return false
      }
    } catch (error: any) {
      showNotification({ title: 'Error', message: error.message || 'Failed to stop service', type: 'error' })
      return false
    }
  },

  // Restart a service
  restartService: async (serviceId: string, authToken: string) => {
    try {
      const response = await fetchGet({
        endpoint: `${endpoint}/coolify/services/${serviceId}/restart`,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        showNotification({ title: 'Success', message: 'Service restarted successfully', type: 'success' })
        return true
      } else {
        showNotification({ title: 'Error', message: response.error || 'Failed to restart service', type: 'error' })
        return false
      }
    } catch (error: any) {
      showNotification({ title: 'Error', message: error.message || 'Failed to restart service', type: 'error' })
      return false
    }
  },

  // Load service environments
  loadServiceEnvironments: async (serviceId: string, authToken: string) => {
    set({ environmentsLoading: true, error: null })
    try {
      const response = await fetchGet({
        endpoint: `${endpoint}/coolify/services/${serviceId}/envs`,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        set({ serviceEnvironments: response.data || [] })
      } else {
        set({ error: response.error || 'Failed to load environments' })
        showNotification({ title: 'Error', message: response.error || 'Failed to load environments', type: 'error' })
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load environments'
      set({ error: errorMessage })
      showNotification({ title: 'Error', message: errorMessage, type: 'error' })
    } finally {
      set({ environmentsLoading: false })
    }
  },

  // Create service environment
  createServiceEnvironment: async (serviceId: string, envData: { key: string; value: string; is_secret?: boolean }, authToken: string) => {
    try {
      const response = await fetchPost({
        endpoint: `${endpoint}/coolify/services/${serviceId}/envs`,
        body: envData,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        showNotification({ title: 'Success', message: 'Environment variable created successfully', type: 'success' })
        // Refresh environments
        await get().loadServiceEnvironments(serviceId, authToken)
        return true
      } else {
        showNotification({ title: 'Error', message: response.error || 'Failed to create environment variable', type: 'error' })
        return false
      }
    } catch (error: any) {
      showNotification({ title: 'Error', message: error.message || 'Failed to create environment variable', type: 'error' })
      return false
    }
  },

  // Update service environment
  updateServiceEnvironment: async (serviceId: string, envId: string, envData: { key: string; value: string; is_secret?: boolean }, authToken: string) => {
    try {
      const response = await fetchPatch({
        endpoint: `${endpoint}/coolify/services/${serviceId}/envs/${envId}`,
        body: envData,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        showNotification({ title: 'Success', message: 'Environment variable updated successfully', type: 'success' })
        // Refresh environments
        await get().loadServiceEnvironments(serviceId, authToken)
        return true
      } else {
        showNotification({ title: 'Error', message: response.error || 'Failed to update environment variable', type: 'error' })
        return false
      }
    } catch (error: any) {
      showNotification({ title: 'Error', message: error.message || 'Failed to update environment variable', type: 'error' })
      return false
    }
  },

  // Delete service environment
  deleteServiceEnvironment: async (serviceId: string, envId: string, authToken: string) => {
    try {
      const response = await fetchDelete({
        endpoint: `${endpoint}/coolify/services/${serviceId}/envs/${envId}`,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        showNotification({ title: 'Success', message: 'Environment variable deleted successfully', type: 'success' })
        // Refresh environments
        await get().loadServiceEnvironments(serviceId, authToken)
        return true
      } else {
        showNotification({ title: 'Error', message: response.error || 'Failed to delete environment variable', type: 'error' })
        return false
      }
    } catch (error: any) {
      showNotification({ title: 'Error', message: error.message || 'Failed to delete environment variable', type: 'error' })
      return false
    }
  },

  // Update service environments bulk
  updateServiceEnvironmentsBulk: async (serviceId: string, environments: ServiceEnvironment[], authToken: string) => {
    try {
      const response = await fetchPatch({
        endpoint: `${endpoint}/coolify/services/${serviceId}/envs/bulk`,
        body: environments,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        showNotification({ title: 'Success', message: 'Environment variables updated successfully', type: 'success' })
        // Refresh environments
        await get().loadServiceEnvironments(serviceId, authToken)
        return true
      } else {
        showNotification({ title: 'Error', message: response.error || 'Failed to update environment variables', type: 'error' })
        return false
      }
    } catch (error: any) {
      showNotification({ title: 'Error', message: error.message || 'Failed to update environment variables', type: 'error' })
      return false
    }
  },

  // Reset state
  resetState: () => {
    const state = get()
    // Stop polling if active
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval)
    }
    set({
      loading: false,
      services: [],
      selectedService: null,
      serviceEnvironments: [],
      environmentsLoading: false,
      serviceTemplates: [],
      templatesLoading: false,
      selectedTemplate: null,
      createModalOpened: false,
      editModalOpened: false,
      deleteModalOpened: false,
      envModalOpened: false,
      creating: false,
      updating: false,
      deleting: false,
      error: null,
      pollingServiceId: null,
      currentPollingService: null,
      pollingInterval: null,
    })
  },

  // Refresh services
  refreshServices: async (authToken: string) => {
    await get().loadServices(authToken)
  },

  // Get live service status from Coolify API
  getServiceStatus: async (serviceId: string, authToken: string) => {
    try {
      const response = await fetchGet({
        endpoint: `${endpoint}/coolify/services/${serviceId}`,
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (response.success) {
        return response.data
      } else {
        console.error('Failed to get service status:', response.error)
        return null
      }
    } catch (error: any) {
      console.error('Error getting service status:', error.message)
      return null
    }
  },

  // Polling Actions
  startPolling: (serviceId, authToken) => {
    const state = get()

    // Stop any existing polling
    if (state.pollingInterval) {
      clearInterval(state.pollingInterval)
    }

    // Set the polling service ID
    set({ pollingServiceId: serviceId })

    // Start polling every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await get().getServiceStatus(serviceId, authToken)
        if (response) {
          set({ currentPollingService: response })
        }
      } catch (error) {
        console.error('Error polling service status:', error)
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
      pollingServiceId: null,
      currentPollingService: null,
      pollingInterval: null,
    })
  },

  updatePollingService: (service) => {
    set({ currentPollingService: service })
  },
}))

export default createUniversalSelectors(useCloudStoreBase)
