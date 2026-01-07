import { Button, Card, Center, Group, Loader, Stack, Text } from '@mantine/core'
import { RiArrowLeftLine } from '@remixicon/react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import useCloudStore from '~/lib/store/cloudStore'
import Mounted from '~/shared/Mounted'
import DeleteServiceModal from './components/DeleteServiceModal'
import EditServiceModal from './components/EditServiceModal'
import ServiceCard from './components/ServiceCard'
import ServiceEnvironmentModal from './components/ServiceEnvironmentModal'

export default function ServiceDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user, getAuthToken } = useAiStore()
  const {
    services,
    loading,
    editModalOpened,
    deleteModalOpened,
    envModalOpened,
    loadServices,
    startService,
    stopService,
    restartService,
    setEditModalOpened,
    setDeleteModalOpened,
    setEnvModalOpened,
    setSelectedService,
    stopPolling,
  } = useCloudStore()

  useEffect(() => {
    if (user?.id) {
      loadServices(getAuthToken())
    }
  }, [user?.id])

  // Cleanup polling when component unmounts
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  const service = services.find((s) => s.id === id)

  const handleBack = () => {
    stopPolling()
    navigate('/account/cloud')
  }

  const handleEditService = () => {
    setSelectedService(service)
    setEditModalOpened(true)
  }

  const handleDeleteService = () => {
    setSelectedService(service)
    setDeleteModalOpened(true)
  }

  const handleManageEnvironments = () => {
    setSelectedService(service)
    setEnvModalOpened(true)
  }

  const handleServiceAction = async (action: 'start' | 'stop' | 'restart', serviceId: string) => {
    switch (action) {
      case 'start':
        await startService(serviceId, getAuthToken())
        break
      case 'stop':
        await stopService(serviceId, getAuthToken())
        break
      case 'restart':
        await restartService(serviceId, getAuthToken())
        break
    }
  }

  if (loading) {
    return (
      <Center h="50vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading cloud services...</Text>
        </Stack>
      </Center>
    )
  }

  if (!service) {
    return (
      <Mounted pageLoading={loading} size="lg">
        <Stack gap="lg">
          <Button variant="subtle" leftSection={<RiArrowLeftLine size={16} />} onClick={handleBack}>
            Back to Cloud Services
          </Button>
          <Card p="xl" ta="center">
            <Stack gap="md">
              <Text size="lg" c="dimmed">
                Service not found
              </Text>
              <Text c="dimmed">The requested service could not be found</Text>
              <Button onClick={handleBack} variant="light">
                Back to Cloud Services
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Mounted>
    )
  }

  return (
    <Mounted pageLoading={loading} size="md">
      <Stack gap="xs">
        <Group>
          <Button variant="subtle" leftSection={<RiArrowLeftLine size={16} />} onClick={handleBack}>
            Back to Cloud Services
          </Button>
        </Group>
        <ServiceCard
          service={service}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
          onManageEnvironments={handleManageEnvironments}
          onServiceAction={handleServiceAction}
        />
      </Stack>

      {/* Modals */}
      <EditServiceModal opened={editModalOpened} onClose={() => setEditModalOpened(false)} service={service} />
      <DeleteServiceModal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} service={service} />
      <ServiceEnvironmentModal opened={envModalOpened} onClose={() => setEnvModalOpened(false)} service={service} />
    </Mounted>
  )
}
