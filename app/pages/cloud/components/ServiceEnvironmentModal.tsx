import { ActionIcon, Alert, Button, Center, Group, Loader, Modal, Stack, Switch, Table, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { RiDeleteBinLine, RiEditLine, RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import type { CloudService, ServiceEnvironment } from '~/lib/store/cloudStore'
import useCloudStore from '~/lib/store/cloudStore'

interface ServiceEnvironmentModalProps {
  opened: boolean
  onClose: () => void
  service: CloudService | null
}

export default function ServiceEnvironmentModal({ opened, onClose, service }: ServiceEnvironmentModalProps) {
  const { getAuthToken } = useAiStore()
  const { serviceEnvironments, environmentsLoading, loadServiceEnvironments, createServiceEnvironment, updateServiceEnvironment, deleteServiceEnvironment } = useCloudStore()

  const [editingEnv, setEditingEnv] = useState<ServiceEnvironment | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const form = useForm({
    initialValues: {
      key: '',
      value: '',
      is_secret: false,
    },
    validate: {
      key: (value) => (!value ? 'Key is required' : null),
      value: (value) => (!value ? 'Value is required' : null),
    },
  })

  useEffect(() => {
    if (opened && service?.service_id) {
      loadServiceEnvironments(service.service_id, getAuthToken())
    }
  }, [opened, service?.service_id])

  const handleSubmit = async (values: typeof form.values) => {
    if (!service?.service_id) return

    if (editingEnv) {
      // Update existing environment variable
      const success = await updateServiceEnvironment(service.service_id, editingEnv.id, values, getAuthToken())
      if (success) {
        form.reset()
        setEditingEnv(null)
      }
    } else {
      // Create new environment variable
      const success = await createServiceEnvironment(service.service_id, values, getAuthToken())
      if (success) {
        form.reset()
      }
    }
  }

  const handleEdit = (env: ServiceEnvironment) => {
    setEditingEnv(env)
    form.setValues({
      key: env.key,
      value: env.value,
      is_secret: env.is_secret || false,
    })
  }

  const handleDelete = async (env: ServiceEnvironment) => {
    if (!service?.service_id) return

    const success = await deleteServiceEnvironment(service.service_id, env.id, getAuthToken())
    if (success) {
      setEditingEnv(null)
      form.reset()
    }
  }

  const handleCancel = () => {
    setEditingEnv(null)
    form.reset()
  }

  const toggleSecretVisibility = (envId: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [envId]: !prev[envId],
    }))
  }

  const serviceName = service?.response?.name || service?.service_id || 'Service'

  if (!service) return null

  return (
    <Modal opened={opened} onClose={onClose} title={`Environment Variables - ${serviceName}`} size="lg" centered>
      <Stack gap="md">
        <Alert color="blue" variant="light">
          Manage environment variables for your service. Changes will be applied immediately.
        </Alert>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Group grow>
              <TextInput label="Key" placeholder="e.g., DATABASE_URL" required {...form.getInputProps('key')} />
              <TextInput label="Value" placeholder="e.g., postgresql://..." required type={form.values.is_secret ? 'password' : 'text'} {...form.getInputProps('value')} />
            </Group>

            <Switch label="Secret (hidden in logs)" description="Mark this as a secret environment variable" {...form.getInputProps('is_secret', { type: 'checkbox' })} />

            <Group justify="flex-end">
              <Button variant="subtle" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">{editingEnv ? 'Update' : 'Add'} Variable</Button>
            </Group>
          </Stack>
        </form>

        {environmentsLoading ? (
          <Center p="xl">
            <Stack align="center" gap="md">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading environment variables...
              </Text>
            </Stack>
          </Center>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Key</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {serviceEnvironments.map((env) => (
                <Table.Tr key={env.id}>
                  <Table.Td>
                    <Text fw={500}>{env.key}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Text
                        size="sm"
                        style={{
                          fontFamily: 'monospace',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {env.is_secret && !showSecrets[env.id] ? '••••••••' : env.value}
                      </Text>
                      {env.is_secret && (
                        <ActionIcon size="sm" variant="subtle" onClick={() => toggleSecretVisibility(env.id)}>
                          {showSecrets[env.id] ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={env.is_secret ? 'red' : 'dimmed'}>
                      {env.is_secret ? 'Secret' : 'Normal'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon size="sm" variant="subtle" onClick={() => handleEdit(env)}>
                        <RiEditLine size={14} />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(env)}>
                        <RiDeleteBinLine size={14} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {serviceEnvironments.length === 0 && !environmentsLoading && (
          <Text ta="center" c="dimmed" py="xl">
            No environment variables found
          </Text>
        )}
      </Stack>
    </Modal>
  )
}
