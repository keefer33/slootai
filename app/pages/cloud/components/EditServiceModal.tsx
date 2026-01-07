import { Alert, Button, Group, Modal, Stack, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { RiInformationLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import type { CloudService } from '~/lib/store/cloudStore'
import useCloudStore from '~/lib/store/cloudStore'

interface EditServiceModalProps {
  opened: boolean
  onClose: () => void
  service: CloudService | null
}

export default function EditServiceModal({ opened, onClose, service }: EditServiceModalProps) {
  const { user, getAuthToken } = useAiStore()
  const { updateService, updating, getServiceStatus } = useCloudStore()
  const [liveStatus, setLiveStatus] = useState<any>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
    },
  })

  // Fetch live service status
  const fetchLiveStatus = async () => {
    if (!service?.service_id) return

    setLoadingStatus(true)
    try {
      const statusData = await getServiceStatus(service.service_id, getAuthToken())
      setLiveStatus(statusData)
    } catch (error) {
      console.error('Error fetching live status:', error)
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    if (service && opened) {
      fetchLiveStatus()
    }
  }, [service, opened])

  useEffect(() => {
    if (liveStatus) {
      form.setValues({
        name: liveStatus.name || service?.response?.name || service?.service_id || '',
        description: liveStatus.description || service?.response?.description || '',
      })
    }
  }, [liveStatus])

  const handleSubmit = async (values: { name: string; description: string }) => {
    if (!user?.id || !service?.service_id) return

    // Update the service with new name and description
    const success = await updateService(
      service.service_id,
      {
        name: values.name,
        description: values.description,
      } as any,
      getAuthToken(),
    )

    if (success) {
      onClose()
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  if (!service) return null

  return (
    <Modal opened={opened} onClose={handleClose} title="Edit Cloud Service" size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert icon={<RiInformationLine size={16} />} title="Service Update" color="blue" variant="light">
            Update your service name and description. Changes will be applied immediately.
          </Alert>

          {loadingStatus ? (
            <div>Loading service data...</div>
          ) : (
            <>
              <TextInput label="Service Name" placeholder="Enter service name" required {...form.getInputProps('name')} />

              <Textarea label="Description" placeholder="Enter service description (optional)" minRows={3} {...form.getInputProps('description')} />

              <Group justify="flex-end" mt="md">
                <Button variant="subtle" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={updating}>
                  Update Service
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </form>
    </Modal>
  )
}
