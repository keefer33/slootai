import { ActionIcon, Button, Card, CopyButton, Group, Modal, Stack, Text, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiEyeLine, RiEyeOffLine, RiFileCopyLine, RiRefreshLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'

export default function ApiKeyManagement() {
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [regenerateModalOpened, { open: openRegenerateModal, close: closeRegenerateModal }] = useDisclosure(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { user, api, generateAndUpdateApiKey } = useAiStore()

  // Load user profile data
  const loadUserProfile = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await api.from('user_profiles').select('*').eq('user_id', user.id).single()
      if (error) {
        console.error('Error loading user profile:', error)
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile()
  }, [user?.id])

  const handleRegenerateConfirm = async () => {
    try {
      setApiKeyLoading(true)

      // Generate and update API key using the useApi hook
      const result = await generateAndUpdateApiKey(false, null, user)

      if (result) {
        showNotification({ title: 'Success', message: 'API key regenerated successfully', type: 'success' })
        closeRegenerateModal()
        setShowApiKey(true) // Show the new key so user can copy it
        // Reload user profile to get the updated API key
        await loadUserProfile()
      }
      // Error already handled in generateAndUpdateApiKey
    } catch (error) {
      console.error('Error regenerating API key:', error)
      showNotification({ title: 'Error', message: 'Failed to regenerate API key', type: 'error' })
    } finally {
      setApiKeyLoading(false)
    }
  }

  const maskApiKey = (key: string) => {
    if (!key || key.length <= 8) return '*'.repeat(key.length || 8)
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={600}>
            Sloot API Key
          </Text>
          <ActionIcon variant="light" color="orange" size="md" onClick={openRegenerateModal} title="Regenerate API Key">
            <RiRefreshLine size={16} />
          </ActionIcon>
        </Group>

        <Card shadow="sm" padding="md" radius="sm">
          <Stack gap="md">
            <Text size="sm" fw={500} c="dimmed">
              API Key
            </Text>

            {/* API Key Display */}

            <Stack gap="xs">
              <Group justify="space-between" align="flex-start">
                <Text
                  size="xs"
                  style={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    lineHeight: 1.4,
                    maxWidth: 'calc(100% - 60px)',
                  }}
                >
                  {showApiKey ? userProfile?.api_key : maskApiKey(userProfile?.api_key || '')}
                </Text>
                <Group gap={4}>
                  <Tooltip label={showApiKey ? 'Hide key' : 'Show key'}>
                    <ActionIcon variant="subtle" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                    </ActionIcon>
                  </Tooltip>
                  <CopyButton value={userProfile?.api_key || ''} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy key'}>
                        <ActionIcon variant="subtle" size="sm" onClick={copy}>
                          <RiFileCopyLine size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </Group>
            </Stack>

            <Text size="xs" c="dimmed">
              Click the refresh icon to generate a new API key. The current key will be invalidated.
            </Text>
          </Stack>
        </Card>
      </Stack>

      {/* Regenerate API Key Confirmation Modal */}
      <Modal opened={regenerateModalOpened} onClose={closeRegenerateModal} title="Regenerate API Key" size="md">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Are you sure you want to regenerate your API key? This action will:
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
            <Button variant="light" onClick={closeRegenerateModal}>
              Cancel
            </Button>
            <Button color="red.5" onClick={() => handleRegenerateConfirm()} loading={apiKeyLoading}>
              Regenerate Key
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
