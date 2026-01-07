import { Alert, Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { RiAlertLine } from '@remixicon/react'
import { useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import type { CloudService } from '~/lib/store/cloudStore'
import useCloudStore from '~/lib/store/cloudStore'

interface DeleteServiceModalProps {
  opened: boolean
  onClose: () => void
  service: CloudService | null
}

export default function DeleteServiceModal({ opened, onClose, service }: DeleteServiceModalProps) {
  const { user, getAuthToken } = useAiStore()
  const { deleteService, deleting } = useCloudStore()
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = async () => {
    if (!user?.id || !service?.service_id) return

    const success = await deleteService(service.service_id, getAuthToken())
    if (success) {
      setConfirmText('')
      onClose()
    }
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  const serviceName = service?.response?.name || service?.service_id || 'this service'
  const isConfirmValid = confirmText === serviceName

  if (!service) return null

  return (
    <Modal opened={opened} onClose={handleClose} title="Delete Cloud Service" size="md" centered>
      <Stack gap="md">
        <Alert icon={<RiAlertLine size={16} />} title="Warning" color="red" variant="light">
          This action cannot be undone. This will permanently delete the service and all its data.
        </Alert>

        <Text>
          Are you sure you want to delete <strong>{serviceName}</strong>?
        </Text>

        <Text size="sm" c="dimmed">
          This will remove the service from both Coolify and your local database.
        </Text>

        <TextInput label={`Type "${serviceName}" to confirm`} placeholder={serviceName} value={confirmText} onChange={(event) => setConfirmText(event.currentTarget.value)} />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={deleting} disabled={!isConfirmValid}>
            Delete Service
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
