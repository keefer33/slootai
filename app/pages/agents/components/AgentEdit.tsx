import { ActionIcon, Button, Group, Modal, Select, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiKeyFill, RiPencilLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useForm } from '~/lib/ContextForm'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import ApiKeys from '~/pages/account/ApiKeys'
import type { UserModel } from '../types'

interface AgentEditProps {
  model: UserModel
  updateSelectedAgent?: boolean
}

export default function AgentEdit({ model, updateSelectedAgent = false }: AgentEditProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [apiKeysModalOpened, { open: openApiKeysModal, close: closeApiKeysModal }] = useDisclosure(false)
  const [loading, setLoading] = useState(false)
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>(model.apikey || '')
  const { setUserModels, api, setSelectedAgent, apiKeys, loadApiKeys, user, getAuthToken } = useAiStore()

  const form = useForm({
    initialValues: {
      id: model.id,
      name: model.name,
      description: model.description || '',
      model_id: model.model_id || '',
    },
  })

  const handleSave = async () => {
    setLoading(true)

    const { error } = await api
      .from('user_models')
      .update({
        name: form.values.name,
        description: form.values.description,
        model_id: form.values.model_id,
        apikey: selectedApiKeyId || null,
      })
      .eq('id', form.values.id)

    if (error) {
      showNotification({ title: 'Error', message: error.message, type: 'error' })
    } else {
      showNotification({ title: 'Success', message: 'Agent updated successfully', type: 'success' })
      close()
      // Reload user models with the proper query
      const { data: userModelsData, error: reloadError } = await api.from('user_models').select('*, model:models(*, brand:brands(slug))').order('created_at', { ascending: false })
      if (reloadError) {
        showNotification({ title: 'Error', message: 'Agent updated but failed to reload list', type: 'error' })
      } else {
        setUserModels(userModelsData || [])
        if (updateSelectedAgent) {
          setSelectedAgent(userModelsData.find((userModel) => userModel.id === form.values.id))
        }
      }
    }
    setLoading(false)
  }

  // Load API keys when modal opens
  useEffect(() => {
    if (opened && user?.id) {
      loadApiKeys(getAuthToken())
    }
  }, [opened, user?.id])

  // Reload API keys when the API keys modal closes
  useEffect(() => {
    if (!apiKeysModalOpened && user?.id) {
      loadApiKeys(getAuthToken())
    }
  }, [apiKeysModalOpened, user?.id])

  return (
    <>
      <ActionIcon
        variant="subtle"
        color="yellow"
        onClick={(e) => {
          e.stopPropagation()
          open()
        }}
        title="Edit"
      >
        <RiPencilLine size={16} />
      </ActionIcon>

      <Modal opened={opened} onClose={close} title="Edit Agent" size="md">
        <Stack gap="xl">
          <TextInput label="Agent Name" placeholder="My Custom Agent" {...form.getInputProps('name')} required />

          <Textarea label="Description" placeholder="Describe what this agent does..." {...form.getInputProps('description')} rows={3} />

          <div>
            <Group justify="space-between" align="flex-end" mb="xs">
              <Text size="sm" fw={500}>
                API Key (Optional)
              </Text>
              <ActionIcon variant="subtle" color="blue" onClick={openApiKeysModal} title="Manage API Keys">
                <RiKeyFill size={24} />
              </ActionIcon>
            </Group>
            <Select
              placeholder="Select an API key or use Sloot's default key"
              data={[{ value: '', label: "Use Sloot's default API key" }, ...(apiKeys?.map((key) => ({ value: key.id, label: key.name })) || [])]}
              value={selectedApiKeyId}
              onChange={(value) => setSelectedApiKeyId(value || '')}
              clearable
              searchable
            />
          </div>

          <Group justify="flex-end">
            <Button variant="light" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading}>
              Update
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* API Keys Management Modal */}
      <Modal opened={apiKeysModalOpened} onClose={closeApiKeysModal} title="Manage API Keys" size="md">
        <ApiKeys />
      </Modal>
    </>
  )
}
