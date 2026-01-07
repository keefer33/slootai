import { Alert, Badge, Button, Group, Modal, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { RiInformationLine } from '@remixicon/react'
import { useEffect } from 'react'
import useAiStore from '~/lib/store/aiStore'
import type { CreateServiceRequest } from '~/lib/store/cloudStore'
import useCloudStore from '~/lib/store/cloudStore'

interface CreateServiceModalProps {
  opened: boolean
  onClose: () => void
  onSuccess?: (serviceId: string) => void
}

export default function CreateServiceModal({ opened, onClose, onSuccess }: CreateServiceModalProps) {
  const { user, getAuthToken } = useAiStore()
  const { createService, creating, selectedTemplate } = useCloudStore()

  const form = useForm<CreateServiceRequest>({
    initialValues: {
      type: selectedTemplate?.type || '',
      name: '',
      description: '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      type: (value) => (!value ? 'Type is required' : null),
    },
  })

  // Update form when selectedTemplate changes
  useEffect(() => {
    if (selectedTemplate) {
      form.setValues({
        type: selectedTemplate.type,
        name: '',
        description: '',
      })
    }
  }, [selectedTemplate])

  const handleSubmit = async (values: CreateServiceRequest) => {
    if (!user?.id) return

    console.log('Creating service with values:', values)
    console.log('Selected template:', selectedTemplate)

    // Include the cloud_services_id from the selected template
    const serviceData: CreateServiceRequest = {
      ...values,
      cloud_services_id: selectedTemplate?.id,
    }

    console.log('Service data being sent:', serviceData)

    const createdService = await createService(serviceData, getAuthToken())
    console.log('Created service result:', createdService)

    if (createdService) {
      form.reset()
      onClose()
      // Navigate to the service detail page
      if (onSuccess && createdService.id) {
        console.log('Navigating to service detail page:', createdService.id)
        onSuccess(createdService.id)
      } else {
        console.log('No onSuccess callback or no service ID')
      }
    } else {
      console.log('Service creation failed or returned null')
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Create Cloud Service" size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert icon={<RiInformationLine size={16} />} title="Service Creation" color="blue" variant="light">
            This will create a new service in your Coolify server. Make sure you have the necessary permissions and resources available.
          </Alert>

          {selectedTemplate && (
            <Alert title={`Selected Template: ${selectedTemplate.name}`} color="green" variant="light">
              <Text size="sm" c="dimmed">
                {selectedTemplate.description}
              </Text>
              {selectedTemplate.category && (
                <Badge size="sm" variant="light" color="blue" mt="xs">
                  {selectedTemplate.category}
                </Badge>
              )}
            </Alert>
          )}

          <TextInput label="Service Name" placeholder="Enter service name" required {...form.getInputProps('name')} />

          <TextInput label="Service Type" value={form.values.type} readOnly disabled description="This is set by the selected template" />

          <Textarea label="Description" placeholder="Enter service description (optional)" minRows={3} {...form.getInputProps('description')} />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Service
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
