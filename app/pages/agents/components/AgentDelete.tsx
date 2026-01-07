import { ActionIcon, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiDeleteBinLine } from '@remixicon/react'
import { useState } from 'react'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import type { UserModel } from '../types'

interface AgentDeleteProps {
  model: UserModel
}

export default function AgentDelete({ model }: AgentDeleteProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [loading, setLoading] = useState(false)
  const { setUserModels, api } = useAiStore()

  const handleDeleteConfirm = async () => {
    setLoading(true)

    const { error: deleteError } = await api.from('user_models').delete().eq('id', model.id)
    if (deleteError) {
      showNotification({ title: 'Error', message: deleteError.message, type: 'error' })
      setLoading(false)
      return
    }

    const { error: threadsError } = await api.from('threads').delete().eq('model_id', model.id)
    if (threadsError) {
      showNotification({ title: 'Warning', message: 'Agent deleted but failed to clean up threads', type: 'warning' })
    }

    close()

    // Reload user models with the proper query
    const { data: userModelsData, error: reloadError } = await api.from('user_models').select('*, model:models(*, brand:brands(slug))').order('created_at', { ascending: false })
    if (reloadError) {
      showNotification({ title: 'Error', message: 'Agent deleted but failed to reload list', type: 'error' })
    } else {
      // Transform the data to populate brand field with slug
      const transformedUserModels = (userModelsData || []).map((model) => ({
        ...model,
        brand: model.model?.brand?.slug || null,
      }))
      setUserModels(transformedUserModels || [])
    }

    showNotification({ title: 'Success', message: 'Agent deleted successfully', type: 'success' })
    setLoading(false)
  }

  return (
    <>
      <ActionIcon
        variant="subtle"
        color="red.5"
        onClick={(e) => {
          e.stopPropagation()
          open()
        }}
        title="Delete"
      >
        <RiDeleteBinLine size={16} />
      </ActionIcon>

      <Modal opened={opened} onClose={close} title="Delete Agent" size="sm">
        <Stack gap="md">
          <Text>Are you sure you want to delete &quot;{model.name}&quot;? This action cannot be undone.</Text>

          <Group justify="flex-end">
            <Button variant="light" onClick={close}>
              Cancel
            </Button>
            <Button color="red.5" onClick={handleDeleteConfirm} loading={loading}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
