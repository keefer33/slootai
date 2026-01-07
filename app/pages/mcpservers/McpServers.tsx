import { Alert, Button, Group, Modal, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiAddLine, RiAlertLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { FormProvider, useForm } from '~/lib/ContextForm'
import { showNotification } from '~/lib/notificationUtils'
import useMcpServersStore from '~/lib/store/mcpServersStore'
import { slug } from '~/lib/utils'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import { McpServerCard } from './components/McpServerCard'

export default function McpServers() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)

  const { mcpServers, selectedMcpServer, setSelectedMcpServer, loadMcpServers, createMcpServer, updateMcpServer, deleteMcpServer } = useMcpServersStore()

  const form = useForm({
    initialValues: {
      server_name: '',
      server_url: '',
      auth_token: '',
      type: 'private',
    },
  })

  const loadServers = async () => {
    setLoading(true)
    await loadMcpServers()
    setLoading(false)
  }

  const handleManageTools = (server: any) => {
    navigate(`/account/mcpservers/${server.id}`)
  }

  useEffect(() => {
    loadServers()
  }, [])

  const handleCreate = () => {
    setSelectedMcpServer(null)
    form.setValues({
      server_name: '',
      server_url: '',
      auth_token: '',
      type: 'private',
    })
    openModal()
  }

  const handleEdit = (mcpServer) => {
    setSelectedMcpServer(mcpServer)
    form.setValues({
      server_name: mcpServer.server_name,
      server_url: mcpServer.server_url,
      auth_token: mcpServer.auth_token || '',
      type: mcpServer.type || 'private',
    })
    openModal()
  }

  const handleDelete = (mcpServer) => {
    setSelectedMcpServer(mcpServer)
    openDeleteModal()
  }

  const handleSave = async () => {
    const values = form.getValues()

    if (!values.server_name.trim()) {
      showNotification({ title: 'Error', message: 'Name is required', type: 'error' })
      return
    }

    if (!values.type) {
      showNotification({ title: 'Error', message: 'Server type is required', type: 'error' })
      return
    }

    // Server URL is required for connect servers
    if (values.type === 'connect' && !values.server_url?.trim()) {
      showNotification({ title: 'Error', message: 'Server URL is required for connect servers', type: 'error' })
      return
    }

    const slugName = slug(values.server_name)

    if (!selectedMcpServer) {
      // Create new server
      const serverData = {
        server_name: slugName,
        server_url: values.type === 'connect' ? values.server_url : `https://mcp.sloot.ai/${Date.now()}`,
        auth_token: values.type === 'connect' ? values.auth_token || null : null,
        type: values.type,
      }

      const newServer = await createMcpServer(serverData)

      if (newServer) {
        // For public/private servers, update with the actual server URL
        if (values.type !== 'connect') {
          const actualServerUrl = `https://mcp.sloot.ai/${newServer.id}`
          await updateMcpServer(newServer.id, { server_url: actualServerUrl })
          setSelectedMcpServer({ ...newServer, server_url: actualServerUrl })
          form.setFieldValue('server_url', actualServerUrl)
        } else {
          setSelectedMcpServer(newServer)
        }

        closeModal()

        // Redirect to edit screen for private servers
        if (values.type === 'private') {
          navigate(`/account/mcpservers/${newServer.id}`)
        }
      } else {
        showNotification({ title: 'Error', message: 'Failed to create MCP server', type: 'error' })
      }
      return
    }

    // Update existing server
    if (!values.server_url.trim()) {
      showNotification({ title: 'Error', message: 'Server URL is required', type: 'error' })
      return
    }

    const updateData = {
      server_name: slugName,
      server_url: values.server_url,
      auth_token: values.type === 'connect' ? values.auth_token || null : null,
      type: values.type,
    }

    const success = await updateMcpServer(selectedMcpServer.id, updateData)

    if (success) {
      closeModal()
    } else {
      showNotification({ title: 'Error', message: 'Failed to update MCP server', type: 'error' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedMcpServer) return

    const success = await deleteMcpServer(selectedMcpServer.id)
    if (success) {
      closeDeleteModal()
    }
  }

  return (
    <Mounted pageLoading={loading}>
      <PageTitle title="MCP Servers" text="Manage your MCP (Model Context Protocol) servers" />

      <Group justify="flex-end" mb="md">
        <Button onClick={handleCreate} variant="light" leftSection={<RiAddLine size={16} />}>
          Create MCP Server
        </Button>
      </Group>

      {loading ? (
        <Text>Loading MCP servers...</Text>
      ) : mcpServers.length === 0 ? (
        <Text c="dimmed">No MCP servers found. Create your first MCP server to get started.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 1, lg: 1 }} spacing="md">
          {mcpServers.map((mcpServer: any) => (
            <McpServerCard key={mcpServer.id} mcpServer={mcpServer} onEdit={handleEdit} onDelete={handleDelete} onManageTools={() => handleManageTools(mcpServer)} />
          ))}
        </SimpleGrid>
      )}

      {/* Create/Edit Modal */}
      <Modal opened={modalOpened} onClose={closeModal} title={selectedMcpServer ? 'Edit MCP Server' : 'Create MCP Server'} size="xl">
        <FormProvider form={form}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <Stack gap="lg">
              {/* Server Details Section */}
              <Stack gap="md">
                <Text fw={600} size="md">
                  Server Details
                </Text>
                <TextInput label="Name" placeholder="Enter MCP server name" required {...form.getInputProps('server_name')} />
                <Select
                  label="Server Type"
                  placeholder="Select server type"
                  data={[
                    { value: 'connect', label: 'Connect - Connect an external MCP server' },
                    { value: 'private', label: 'Private - Create a new MCP server to use with your own auth token' },
                  ]}
                  required
                  value={form.values.type}
                  onChange={(value) => {
                    form.setFieldValue('type', value || 'private')
                  }}
                  disabled={!!selectedMcpServer}
                />
                {/* Show Server URL field for connect servers */}
                {form.values.type === 'connect' && <TextInput label="Server URL" placeholder="Enter your server URL" required {...form.getInputProps('server_url')} />}
                {/* Show read-only Server URL for existing servers */}
                {selectedMcpServer && form.values.type !== 'connect' && <TextInput label="Server URL" value={form.values.server_url} readOnly disabled />}
                {/* Show Auth Token only for connect servers */}
                {form.values.type === 'connect' && (
                  <TextInput label="Auth Token (Optional)" placeholder="Enter authentication token (optional)" {...form.getInputProps('auth_token')} />
                )}
              </Stack>

              {/* Warning for public servers */}
              {form.values.type === 'public' && !selectedMcpServer && (
                <Alert icon={<RiAlertLine size={16} />} title="Public Server Warning" color="orange" variant="light">
                  <Text size="sm">
                    <strong>Warning:</strong> This MCP server will be accessible without an auth token. Any tools attached to this server that contain API URLs with authentication
                    tokens will also be accessible to the public. Make sure you understand the security implications before creating a public server.
                  </Text>
                </Alert>
              )}

              <Group justify="flex-end">
                <Button variant="light" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">{selectedMcpServer ? 'Update' : 'Create'}</Button>
              </Group>
            </Stack>
          </form>
        </FormProvider>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Delete MCP Server" size="sm">
        <Stack gap="md">
          <Text>Are you sure you want to delete the MCP server &quot;{selectedMcpServer?.server_name}&quot;? This action cannot be undone.</Text>

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
    </Mounted>
  )
}
