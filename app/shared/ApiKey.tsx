import { ActionIcon, Box, Button, CopyButton, Group, Modal, Stack, Text, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiEyeLine, RiEyeOffLine, RiFileCopyLine, RiRefreshLine } from '@remixicon/react'
import { useState } from 'react'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'

interface ApiKeyProps {
  apiKey: string
  entityId: string | number
  entityName: string
  tableName: 'user_models' | 'user_mcp_servers'
  onApiKeyUpdate?: (newApiKey: string) => void
  showLabel?: boolean
}

export default function ApiKey({ apiKey, entityId, entityName, tableName, onApiKeyUpdate, showLabel = true }: ApiKeyProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [regenerateModalOpened, { open: openRegenerateModal, close: closeRegenerateModal }] = useDisclosure(false)
  const [currentApiKey, setCurrentApiKey] = useState(apiKey)
  const [loading, setLoading] = useState(false)
  const { api, user, regenerateMcpServerApiKey } = useAiStore()

  const maskApiKey = (key: string) => {
    if (!key || key.length <= 8) return '*'.repeat(key?.length || 8)
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  const generateNewApiKey = () => {
    return crypto.randomUUID()
  }

  const handleRegenerateApiKey = async () => {
    try {
      setLoading(true)
      let newApiKey: string | null = null

      if (tableName === 'user_mcp_servers') {
        // Use the store function for MCP servers
        newApiKey = await regenerateMcpServerApiKey(entityId as number)
      } else {
        // Handle user_models directly
        newApiKey = generateNewApiKey()
        const { error } = await api.from(tableName).update({ api_key: newApiKey }).eq('id', entityId).eq('user_id', user?.id)

        if (error) {
          showNotification({ title: 'Error', message: error.message, type: 'error' })
          return
        }

        // Fetch the updated entity to get the new API key
        const { data, error: fetchError } = await api.from(tableName).select('api_key').eq('id', entityId).single()
        if (fetchError) {
          showNotification({ title: 'Error', message: fetchError.message, type: 'error' })
          return
        }
        newApiKey = data.apikey
      }

      if (newApiKey) {
        setCurrentApiKey(newApiKey)
        onApiKeyUpdate?.(newApiKey)
        showNotification({ title: 'Success', message: 'API key regenerated successfully', type: 'success' })
      }
      closeRegenerateModal()
    } catch (error) {
      console.error('Error regenerating API key:', error)
      showNotification({ title: 'Error', message: 'Failed to regenerate API key', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!currentApiKey) {
    return null
  }

  return (
    <>
      <Group>
        <Stack gap="xs">
          <Group justify="space-between">
            {showLabel && (
              <Text size="xs" fw={500} c="dimmed">
                API Key
              </Text>
            )}
            <Group gap={4}>
              <Tooltip label={showApiKey ? 'Hide key' : 'Show key'}>
                <ActionIcon variant="subtle" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
                </ActionIcon>
              </Tooltip>
              <CopyButton value={currentApiKey} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied' : 'Copy key'}>
                    <ActionIcon variant="subtle" size="sm" onClick={copy}>
                      <RiFileCopyLine size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              <Tooltip label="Regenerate key">
                <ActionIcon variant="subtle" size="sm" color="orange" onClick={openRegenerateModal}>
                  <RiRefreshLine size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
          <Group gap="xs" align="center">
            <Text size="xs" style={{ fontFamily: 'monospace' }}>
              {showApiKey ? currentApiKey : maskApiKey(currentApiKey)}
            </Text>
          </Group>
        </Stack>
      </Group>
      {/* Regenerate API Key Confirmation Modal */}
      <Modal opened={regenerateModalOpened} onClose={closeRegenerateModal} title="Regenerate API Key" size="md">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Are you sure you want to regenerate the API key for &quot;{entityName}&quot;? This action will:
          </Text>

          <Stack gap="xs">
            <Text size="sm">• Generate a new API key</Text>
            <Text size="sm">• Invalidate the current API key</Text>
            <Text size="sm">• Require you to update any applications using the old key</Text>
          </Stack>

          <Text size="sm" fw={500} c="red">
            This action cannot be undone.
          </Text>

          <Group justify="flex-end" gap="md">
            <Button variant="light" onClick={closeRegenerateModal} disabled={loading}>
              Cancel
            </Button>
            <Button color="red.5" onClick={handleRegenerateApiKey} loading={loading}>
              Regenerate Key
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
