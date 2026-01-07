import { ActionIcon, Button, Card, Group, Modal, ScrollArea, Select, Stack, Text, TextInput, Textarea, Title, useMantineColorScheme, useMantineTheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiAddLine, RiKeyFill } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from '~/lib/ContextForm'
import useAgentsUtils from '~/lib/hooks/useAgentsUtils'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import ApiKeys from '~/pages/account/ApiKeys'

export default function AgentCreateNew() {
  const theme = useMantineTheme()
  const { colorScheme } = useMantineColorScheme()
  const [opened, { open, close }] = useDisclosure(false)
  const [apiKeysModalOpened, { open: openApiKeysModal, close: closeApiKeysModal }] = useDisclosure(false)
  const [loading, setLoading] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>('')
  const { models, setUserModels, api, user, setSelectedModel, apiKeys, loadApiKeys, getAuthToken } = useAiStore()
  const { getDefaultValues } = useAgentsUtils()
  const navigate = useNavigate()
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      model_id: '',
    },
  })

  const handleSave = async () => {
    if (!selectedModelId) {
      showNotification({ title: 'Error', message: 'Please select a model', type: 'error' })
      return
    }

    setLoading(true)
    const model = models.find((m) => m.id === selectedModelId)
    setSelectedModel(model)

    const newValues = {
      ...form.values,
      model_id: selectedModelId,
      apikey: selectedApiKeyId || null, // Reference to user_apikeys table
      settings: { config: getDefaultValues(), brand: model?.brand, model: model?.model, mcp_servers: [], pipedream: [], tools: [], files: [] },
      payload: getDefaultValues(),
      user_id: user?.id,
    }

    const { data: newAgent, error } = await api.from('user_models').insert(newValues).select().single()
    if (error) {
      showNotification({ title: 'Error', message: error.message, type: 'error' })
    } else {
      showNotification({ title: 'Success', message: 'Agent created successfully', type: 'success' })
      close()
      // Reload user models with the proper query
      const { data: userModelsData, error: reloadError } = await api.from('user_models').select('*, model:models(*, brand:brands(slug))').order('created_at', { ascending: false })
      if (reloadError) {
        showNotification({ title: 'Error', message: 'Agent created but failed to reload list', type: 'error' })
      } else {
        // Transform the data to populate brand field with slug
        const transformedUserModels = (userModelsData || []).map((model) => ({
          ...model,
          brand: model.model?.brand?.slug || null,
        }))
        setUserModels(transformedUserModels || [])
      }
      // Navigate to the new agent's playground page
      if (newAgent) {
        navigate(`/account/agents/${newAgent.id}`)
      }
    }
    setLoading(false)
  }

  const handleClose = () => {
    setSelectedModelId('')
    setSelectedApiKeyId('')
    form.reset()
    close()
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
      <Button leftSection={<RiAddLine size={16} />} onClick={() => open()} variant="filled">
        Create Agent
      </Button>

      <Modal opened={opened} onClose={handleClose} title="Create New Agent" size="lg">
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

          <div>
            <Text size="sm" fw={500} mb="xs">
              Base Model <span style={{ color: 'red' }}>*</span>
            </Text>
            <ScrollArea h={300} type="scroll">
              <Stack gap="md">
                {(() => {
                  const grouped: Record<string, any[]> = {}
                  const modelsList = models || []

                  // Group models by brand
                  modelsList.forEach((model) => {
                    if (!grouped[model.brand]) {
                      grouped[model.brand] = []
                    }
                    grouped[model.brand].push(model)
                  })

                  // Sort brands alphabetically
                  const sortedBrands = Object.keys(grouped).sort()

                  return sortedBrands.map((brand) => (
                    <div key={brand}>
                      <Title order={5} mb="sm" c={colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[6]}>
                        {brand}
                      </Title>
                      <Stack gap="xs">
                        {grouped[brand].map((model) => {
                          const isSelected = selectedModelId === model.id
                          const inputPrice = model.input_per_1k ? `$${model.input_per_1k.toFixed(4)}` : 'N/A'
                          const outputPrice = model.output_per_1k ? `$${model.output_per_1k.toFixed(4)}` : 'N/A'

                          return (
                            <Card
                              key={model.id}
                              padding="xs"
                              radius="xs"
                              withBorder
                              style={{
                                cursor: 'pointer',
                                borderColor: isSelected
                                  ? colorScheme === 'dark'
                                    ? theme.colors[theme.primaryColor][7]
                                    : theme.colors[theme.primaryColor][7]
                                  : colorScheme === 'dark'
                                    ? theme.colors.dark[6]
                                    : theme.white,
                                backgroundColor: isSelected
                                  ? colorScheme === 'dark'
                                    ? theme.colors.dark[6]
                                    : theme.white
                                  : colorScheme === 'dark'
                                    ? theme.colors.dark[6]
                                    : theme.white,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  borderColor: theme.colors[theme.primaryColor][4],
                                  backgroundColor: colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[0],
                                },
                              }}
                              onClick={() => setSelectedModelId(model.id)}
                            >
                              <Group justify="space-between" align="center" wrap="nowrap">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    fw={500}
                                    size="sm"
                                    truncate
                                    c={isSelected ? theme.colors[theme.primaryColor][7] : colorScheme === 'dark' ? theme.colors.gray[0] : theme.colors.dark[7]}
                                  >
                                    {model.model}
                                  </Text>
                                  <Text size="xs" c={colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[6]} lineClamp={2}>
                                    {model.description || 'No description available'}
                                  </Text>
                                </div>
                                {!selectedApiKeyId && (
                                  <div
                                    style={{
                                      textAlign: 'right',
                                      minWidth: '120px',
                                      flexShrink: 0,
                                      marginLeft: '12px',
                                    }}
                                  >
                                    <Text size="xs" fw={500} c={theme.colors[theme.primaryColor][7]}>
                                      Input: {inputPrice}
                                    </Text>
                                    <Text size="xs" fw={500} c={theme.colors[theme.primaryColor][5]}>
                                      Output: {outputPrice}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      Per 1K Tokens
                                    </Text>
                                  </div>
                                )}
                              </Group>
                            </Card>
                          )
                        })}
                      </Stack>
                    </div>
                  ))
                })()}
              </Stack>
            </ScrollArea>
          </div>

          <Group justify="flex-end">
            <Button variant="light" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading} disabled={!selectedModelId}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* API Keys Management Modal */}
      <Modal opened={apiKeysModalOpened} onClose={closeApiKeysModal} title="Manage API Keys" size="xl">
        <ApiKeys />
      </Modal>
    </>
  )
}
