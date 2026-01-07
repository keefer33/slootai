import { Button, Card, Group, Modal, Select, Stack, Text, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiAddLine, RiCheckLine, RiCloseLine, RiDeleteBinLine, RiEditLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'

export interface ApiConnection {
  id: string
  user_id: string
  api_url: string
  auth_token: string
  created_at: string
}

interface ApiConnectionManagerProps {
  // Selection mode props
  value?: string
  onChange?: (value: string | null) => void
  label?: string
  onConnectionCreated?: (connectionId: string) => void
  // Standalone modal props
  opened?: boolean
  onClose?: () => void
  // Mode selection
  mode?: 'selection' | 'modal' | 'manage'
}

export function ApiConnectionManager({ value, onChange, label = 'API Connection', onConnectionCreated, opened, onClose, mode = 'selection' }: ApiConnectionManagerProps) {
  const [connections, setConnections] = useState<ApiConnection[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
  const [selectedConnection, setSelectedConnection] = useState<ApiConnection | null>(null)
  const [toolsUsingConnection, setToolsUsingConnection] = useState<any[]>([])
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null)
  const { api, user } = useAiStore()

  const form = useForm({
    initialValues: {
      api_url: '',
      auth_token: '',
    },
  })

  const editForm = useForm({
    initialValues: {
      api_url: '',
      auth_token: '',
    },
  })

  const loadConnections = async () => {
    setLoading(true)
    try {
      const { data, error } = await api.from('user_connect_api').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
        return
      }
      setConnections(data || [])
    } catch (error) {
      console.error('Error loading API connections:', error)
      showNotification({ title: 'Error', message: 'Failed to load API connections', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const checkToolsUsingConnection = async (connectionId: string) => {
    try {
      const { data, error } = await api.from('user_tools').select('id, tool_name').eq('user_connect_api_id', connectionId)

      if (error) {
        console.error('Error checking tools using connection:', error)
        return []
      }
      return data || []
    } catch (error) {
      console.error('Error checking tools using connection:', error)
      return []
    }
  }

  const handleDeleteConnection = async (connection: ApiConnection) => {
    setSelectedConnection(connection)

    // Check if any tools are using this connection
    const tools = await checkToolsUsingConnection(connection.id)
    setToolsUsingConnection(tools)

    openDeleteModal()
  }

  const handleDeleteConfirm = async () => {
    if (!selectedConnection) return

    try {
      const { error } = await api.from('user_connect_api').delete().eq('id', selectedConnection.id).eq('user_id', user?.id)

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
      } else {
        showNotification({ title: 'Success', message: 'API connection deleted successfully', type: 'success' })

        // If the deleted connection was selected, clear the selection
        if (value === selectedConnection.id && onChange) {
          onChange(null)
        }

        await loadConnections()
        closeDeleteModal()
      }
    } catch (error) {
      console.error('Error deleting API connection:', error)
      showNotification({ title: 'Error', message: 'Failed to delete API connection', type: 'error' })
    }
  }

  const handleCreateConnection = async () => {
    const values = form.getValues()

    if (!values.api_url.trim()) {
      showNotification({ title: 'Error', message: 'API URL is required', type: 'error' })
      return
    }

    try {
      const { data, error } = await api
        .from('user_connect_api')
        .insert({
          api_url: values.api_url,
          auth_token: values.auth_token || '',
          user_id: user?.id,
        })
        .select()
        .single()

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
      } else {
        showNotification({ title: 'Success', message: 'API connection created successfully', type: 'success' })
        await loadConnections()

        if (mode === 'selection') {
          // For selection mode, close modal and auto-select the new connection
          closeModal()
          if (onChange) {
            onChange(data.id)
          }
          if (onConnectionCreated) {
            onConnectionCreated(data.id)
          }
        }

        form.reset()
      }
    } catch (error) {
      console.error('Error creating API connection:', error)
      showNotification({ title: 'Error', message: 'Failed to create API connection', type: 'error' })
    }
  }

  const handleStartEdit = (connection: ApiConnection) => {
    setEditingConnectionId(connection.id)
    editForm.setValues({
      api_url: connection.api_url,
      auth_token: connection.auth_token,
    })
  }

  const handleCancelEdit = () => {
    setEditingConnectionId(null)
    editForm.reset()
  }

  const handleSaveEdit = async () => {
    const values = editForm.getValues()

    if (!values.api_url.trim()) {
      showNotification({ title: 'Error', message: 'API URL is required', type: 'error' })
      return
    }

    if (!editingConnectionId) return

    try {
      const { error } = await api
        .from('user_connect_api')
        .update({
          api_url: values.api_url,
          auth_token: values.auth_token || '',
        })
        .eq('id', editingConnectionId)
        .eq('user_id', user?.id)

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
      } else {
        showNotification({ title: 'Success', message: 'API connection updated successfully', type: 'success' })
        setEditingConnectionId(null)
        editForm.reset()
        await loadConnections()
      }
    } catch (error) {
      console.error('Error updating API connection:', error)
      showNotification({ title: 'Error', message: 'Failed to update API connection', type: 'error' })
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadConnections()
    }
  }, [user?.id])

  // For modal mode, also load when modal opens
  useEffect(() => {
    if (user?.id && mode === 'modal' && opened) {
      loadConnections()
    }
  }, [user?.id, mode, opened])

  const connectionOptions = connections.map((conn) => ({
    value: conn.id,
    label: conn.api_url,
  }))

  const isModalOpen = mode === 'modal' ? opened : modalOpened
  const handleModalClose = mode === 'modal' ? onClose : closeModal

  return (
    <>
      {/* Selection UI - only show in selection mode */}
      {mode === 'selection' ? (
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              {label}
            </Text>
            <Button size="xs" variant="light" leftSection={<RiAddLine size={14} />} onClick={openModal}>
              Create New
            </Button>
          </Group>
          <Select data={connectionOptions} value={value || null} onChange={onChange} placeholder="Select an API connection" searchable clearable />
        </Stack>
      ) : (
        <Button size="xs" variant="light" leftSection={<RiAddLine size={14} />} onClick={openModal}>
          Create New Connection
        </Button>
      )}

      {/* Management Modal */}
      <Modal opened={isModalOpen} onClose={handleModalClose} title="Manage API Connections" size="lg">
        <Stack gap="md">
          {/* Create New Connection Form */}
          <Stack gap="md">
            <Text fw={500} size="sm">
              Create New Connection
            </Text>
            <FormProvider form={form}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCreateConnection()
                }}
              >
                <Stack gap="md">
                  <TextInput label="API URL" placeholder="https://api.example.com" required {...form.getInputProps('api_url')} />
                  <TextInput label="Auth Token (Optional)" placeholder="Enter authentication token (optional)" {...form.getInputProps('auth_token')} />

                  <Group justify="flex-end">
                    <Button type="submit">Create Connection</Button>
                  </Group>
                </Stack>
              </form>
            </FormProvider>
          </Stack>

          {/* Existing Connections List */}
          <Stack gap="md">
            <Text fw={500} size="sm">
              Existing Connections
            </Text>
            {loading ? (
              <Text size="sm" c="dimmed">
                Loading connections...
              </Text>
            ) : connections.length === 0 ? (
              <Text size="sm" c="dimmed">
                No API connections found.
              </Text>
            ) : (
              <Stack gap="xs">
                {connections.map((connection) => (
                  <Card key={connection.id} p="xs" shadow="sm">
                    {editingConnectionId === connection.id ? (
                      <FormProvider form={editForm}>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSaveEdit()
                          }}
                        >
                          <Stack gap="xs">
                            <TextInput label="API URL" placeholder="https://api.example.com" required size="xs" {...editForm.getInputProps('api_url')} />
                            <TextInput label="Auth Token (Optional)" placeholder="Enter authentication token (optional)" size="xs" {...editForm.getInputProps('auth_token')} />
                            <Group justify="flex-end" gap="xs">
                              <Button size="xs" variant="light" onClick={handleCancelEdit} leftSection={<RiCloseLine size={12} />}>
                                Cancel
                              </Button>
                              <Button size="xs" type="submit" leftSection={<RiCheckLine size={12} />}>
                                Save
                              </Button>
                            </Group>
                          </Stack>
                        </form>
                      </FormProvider>
                    ) : (
                      <Group justify="space-between">
                        <Stack gap={0}>
                          <Text size="sm" fw={500} c="gray.6">
                            {connection.api_url}
                          </Text>
                          {connection.auth_token && (
                            <Text size="xs" c="dimmed">
                              Has auth token
                            </Text>
                          )}
                        </Stack>
                        <Group gap={4}>
                          <Button size="xs" variant="light" leftSection={<RiEditLine size={12} />} onClick={() => handleStartEdit(connection)}>
                            Edit
                          </Button>
                          <Button size="xs" variant="light" color="red.5" leftSection={<RiDeleteBinLine size={12} />} onClick={() => handleDeleteConnection(connection)}>
                            Delete
                          </Button>
                        </Group>
                      </Group>
                    )}
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>

          <Group justify="flex-end">
            <Button variant="light" onClick={closeModal}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Delete API Connection" size="sm">
        <Stack gap="md">
          <Text>Are you sure you want to delete the API connection &quot;{selectedConnection?.api_url}&quot;?</Text>

          {toolsUsingConnection.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" fw={500} c="orange">
                ⚠️ Warning: This connection is being used by {toolsUsingConnection.length} tool(s):
              </Text>
              <Stack gap="xs" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {toolsUsingConnection.map((tool) => (
                  <Text key={tool.id} size="sm" c="dimmed">
                    • {tool.tool_name}
                  </Text>
                ))}
              </Stack>
              <Text size="sm" c="orange">
                Deleting this connection may cause these tools to stop working properly.
              </Text>
            </Stack>
          )}

          <Group justify="flex-end">
            <Button variant="light" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red.5" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
