import { ActionIcon, Button, Card, Divider, Group, Modal, SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiAddLine, RiCloseLine, RiDeleteBinLine, RiPencilLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import { formatDate } from '~/lib/utils'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import ApiKeyManagement from './components/ApiKeyManagement'

interface ApiKey {
  id: string
  name: string
  key: string
  provider: string
  created_at: string
  is_active: boolean
}

export default function ApiKeys() {
  const [loading, setLoading] = useState(true)
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState('')
  const [replacingKey, setReplacingKey] = useState<string | null>(null)
  const [newKeyValue, setNewKeyValue] = useState('')

  const { api, user, apiKeys, selectedApiKey, setSelectedApiKey, loadApiKeys, addApiKey, updateApiKey, removeApiKey, getAuthToken } = useAiStore()

  const form = useForm({
    initialValues: {
      name: '',
      key: '',
    },
  })

  const loadApiKeysData = async () => {
    try {
      setLoading(true)
      await loadApiKeys(getAuthToken())
    } catch (error) {
      console.error('Error loading API keys:', error)
      showNotification({ title: 'Error', message: 'Failed to load API keys', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadApiKeysData()
    }
  }, [user?.id])

  const handleCreate = () => {
    form.setValues({ name: '', key: '' })
    openModal()
  }

  const handleDelete = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey)
    openDeleteModal()
  }

  const handleSave = async () => {
    const values = form.getValues()

    if (!values.name.trim()) {
      showNotification({ title: 'Error', message: 'Name is required', type: 'error' })
      return
    }

    if (!values.key.trim()) {
      showNotification({ title: 'Error', message: 'API key is required', type: 'error' })
      return
    }

    try {
      // Create new API key with user-provided key
      const { data, error } = await api
        .from('user_apikeys')
        .insert({
          name: values.name,
          user_id: user?.id,
          key: values.key.trim(),
        })
        .select()

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
      } else {
        showNotification({ title: 'Success', message: 'API key created successfully', type: 'success' })
        // Add new key to store using helper
        if (data && data[0]) {
          addApiKey(data[0])
        }
      }

      closeModal()
    } catch (error) {
      console.error('Error saving API key:', error)
      showNotification({ title: 'Error', message: 'Failed to save API key', type: 'error' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedApiKey) return

    try {
      const { error } = await api.from('user_apikeys').delete().eq('id', selectedApiKey.id).eq('user_id', user?.id)

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
      } else {
        showNotification({ title: 'Success', message: 'API key deleted successfully', type: 'success' })
        // Update local state using store helper
        removeApiKey(selectedApiKey.id)
        closeDeleteModal()
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      showNotification({ title: 'Error', message: 'Failed to delete API key', type: 'error' })
    }
  }

  const handleStartEditName = (apiKey: ApiKey) => {
    setEditingName(apiKey.id)
    setEditingNameValue(apiKey.name)
  }

  const handleStartReplaceKey = (apiKey: ApiKey) => {
    setReplacingKey(apiKey.id)
    setNewKeyValue('')
  }

  const handleSaveName = async (apiKey: ApiKey) => {
    if (!editingNameValue.trim()) {
      showNotification({ title: 'Error', message: 'Name is required', type: 'error' })
      return
    }

    try {
      const { error } = await api.from('user_apikeys').update({ name: editingNameValue.trim() }).eq('id', apiKey.id).eq('user_id', user?.id)

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
      } else {
        showNotification({ title: 'Success', message: 'API key name updated successfully', type: 'success' })
        updateApiKey(apiKey.id, { name: editingNameValue.trim() })
        setEditingName(null)
        setEditingNameValue('')
      }
    } catch (error) {
      console.error('Error updating API key name:', error)
      showNotification({ title: 'Error', message: 'Failed to update API key name', type: 'error' })
    }
  }

  const handleSaveNewKey = async (apiKey: ApiKey) => {
    if (!newKeyValue.trim()) {
      showNotification({ title: 'Error', message: 'New API key is required', type: 'error' })
      return
    }

    try {
      const { error } = await api.from('user_apikeys').update({ key: newKeyValue.trim() }).eq('id', apiKey.id).eq('user_id', user?.id)

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
      } else {
        showNotification({ title: 'Success', message: 'API key replaced successfully', type: 'success' })
        updateApiKey(apiKey.id, { key: newKeyValue.trim() })
        setReplacingKey(null)
        setNewKeyValue('')
      }
    } catch (error) {
      console.error('Error replacing API key:', error)
      showNotification({ title: 'Error', message: 'Failed to replace API key', type: 'error' })
    }
  }

  const handleCancelNameEdit = () => {
    setEditingName(null)
    setEditingNameValue('')
  }

  const handleCancelKeyReplace = () => {
    setReplacingKey(null)
    setNewKeyValue('')
  }

  const apiKeyCards = apiKeys?.map((apiKey) => (
    <Card key={apiKey.id} shadow="sm" padding="lg" radius="sm">
      <Stack gap="md">
        {/* Header with name and actions */}
        <Group justify="space-between" align="center">
          {editingName === apiKey.id ? (
            <TextInput value={editingNameValue} onChange={(e) => setEditingNameValue(e.target.value)} size="sm" style={{ flex: 1 }} autoFocus />
          ) : (
            <Text fw={600} size="lg">
              {apiKey.name}
            </Text>
          )}
          <Group gap="xs">
            {editingName === apiKey.id ? (
              <>
                <ActionIcon variant="subtle" color="green" onClick={() => handleSaveName(apiKey)} title="Save name">
                  <RiPencilLine size={16} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="gray" onClick={handleCancelNameEdit} title="Cancel">
                  <RiCloseLine size={16} />
                </ActionIcon>
              </>
            ) : (
              <>
                <ActionIcon variant="subtle" color="blue" onClick={() => handleStartEditName(apiKey)} title="Edit name">
                  <RiPencilLine size={16} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="red.5" onClick={() => handleDelete(apiKey)} title="Delete">
                  <RiDeleteBinLine size={16} />
                </ActionIcon>
              </>
            )}
          </Group>
        </Group>

        {/* API Key section */}
        {replacingKey === apiKey.id ? (
          <Stack gap="xs">
            <Text size="xs" c="orange" fw={500}>
              ⚠️ Replace API Key: Current key is masked for security. Enter new key to replace it.
            </Text>
            <TextInput
              label="New API Key"
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              size="sm"
              style={{ fontFamily: 'monospace' }}
              placeholder="Enter new API key"
              required
            />
            <Group gap="xs">
              <Button size="xs" color="green" onClick={() => handleSaveNewKey(apiKey)}>
                Replace Key
              </Button>
              <Button size="xs" variant="light" onClick={handleCancelKeyReplace}>
                Cancel
              </Button>
            </Group>
            <Text size="xs" c="dimmed">
              Created: {formatDate(apiKey.created_at)}
            </Text>
          </Stack>
        ) : (
          <Group gap="xs" justify="space-between" align="center">
            <Text size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {apiKey.key}
            </Text>
            <Group gap="xs">
              <Button size="xs" variant="light" color="orange" onClick={() => handleStartReplaceKey(apiKey)}>
                Replace Key
              </Button>
              <Text size="xs" c="dimmed">
                Created: {formatDate(apiKey.created_at)}
              </Text>
            </Group>
          </Group>
        )}
      </Stack>
    </Card>
  ))

  return (
    <Mounted size="sm">
      <PageTitle title="API Keys" text="Manage your API keys" />
      <ApiKeyManagement />
      <Divider my="xl" />
      <Group justify="space-between" my="md">
        <Text size="lg" fw={600}>
          API keys for external integrations
        </Text>
        <Button onClick={handleCreate} variant="light" leftSection={<RiAddLine size={16} />}>
          Create API Key
        </Button>
      </Group>

      {loading ? (
        <Text>Loading API keys...</Text>
      ) : !apiKeys || apiKeys.length === 0 ? (
        <Text c="dimmed">No API keys found. Create your first API key to get started.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 1, md: 1, lg: 1 }} spacing="md">
          {apiKeyCards}
        </SimpleGrid>
      )}

      {/* Create Modal */}
      <Modal opened={modalOpened} onClose={closeModal} title="Create API Key" size="md">
        <FormProvider form={form}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <Stack gap="md">
              <TextInput label="Name" placeholder="Enter API key name" required {...form.getInputProps('name')} />
              <TextInput label="API Key" placeholder="Enter your API key" required {...form.getInputProps('key')} />

              <Group justify="flex-end">
                <Button variant="light" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </Group>
            </Stack>
          </form>
        </FormProvider>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Delete API Key" size="sm">
        <Stack gap="md">
          <Text>
            Are you sure you want to delete the API key &quot;{selectedApiKey?.name}&quot;? This action cannot be undone and any applications using this key will no longer work.
          </Text>

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
