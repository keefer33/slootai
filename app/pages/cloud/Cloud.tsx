import { Button, Card, Center, Grid, Group, Loader, Stack, Tabs, Text } from '@mantine/core'
import { RiAddLine, RiCloudLine, RiDatabase2Line } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import useCloudStore from '~/lib/store/cloudStore'
import { useDatabaseStore } from '~/lib/store/databaseStore'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import DeleteDatabaseModal from './components/DeleteDatabaseModal'
import DeleteServiceModal from './components/DeleteServiceModal'
import SimpleDatabaseCard from './components/SimpleDatabaseCard'
import SimpleServiceCard from './components/SimpleServiceCard'

export default function Cloud() {
  const navigate = useNavigate()
  const { user, getAuthToken } = useAiStore()
  const { services, loading, deleteModalOpened, selectedService, loadServices, setDeleteModalOpened, setSelectedService } = useCloudStore()
  const {
    databases,
    loading: databasesLoading,
    deleteModalOpened: dbDeleteModalOpened,
    selectedDatabase,
    loadDatabases,
    setDeleteModalOpened: setDbDeleteModalOpened,
    setSelectedDatabase,
  } = useDatabaseStore()
  const [activeTab, setActiveTab] = useState<string | null>('services')

  useEffect(() => {
    if (user?.id) {
      loadServices(getAuthToken())
      loadDatabases(getAuthToken())
    }
  }, [user?.id])

  const handleCreateService = () => {
    navigate('/account/cloud/select-service')
  }

  const handleCreateDatabase = () => {
    navigate('/account/cloud/select-database')
  }

  const handleDeleteService = (service: any) => {
    setSelectedService(service)
    setDeleteModalOpened(true)
  }

  const handleDeleteDatabase = (database: any) => {
    setSelectedDatabase(database)
    setDbDeleteModalOpened(true)
  }

  if (loading || databasesLoading) {
    return (
      <Center h="50vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading cloud services and databases...</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Mounted pageLoading={loading || databasesLoading} size="md">
      <Stack gap="lg">
        <PageTitle title="Cloud Services & Databases" text="Manage your cloud applications, services, and databases" />

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="services" leftSection={<RiCloudLine size={16} />}>
              Cloud Services ({services.length})
            </Tabs.Tab>
            <Tabs.Tab value="databases" leftSection={<RiDatabase2Line size={16} />}>
              Cloud Databases ({databases.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="services" pt="md">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={600} size="lg">
                  Cloud Services
                </Text>
                <Button leftSection={<RiAddLine size={16} />} onClick={handleCreateService} size="sm">
                  Create Service
                </Button>
              </Group>

              {services.length === 0 ? (
                <Card p="xl" ta="center">
                  <Stack gap="md">
                    <Text size="lg" c="dimmed">
                      No cloud services found
                    </Text>
                    <Text c="dimmed">Create your first cloud service to get started</Text>
                    <Button leftSection={<RiAddLine size={16} />} onClick={handleCreateService} size="sm" variant="light">
                      Create Service
                    </Button>
                  </Stack>
                </Card>
              ) : (
                <Grid>
                  {services.map((service) => (
                    <Grid.Col key={service.id} span={{ base: 12, sm: 12, md: 12, lg: 12 }}>
                      <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/account/cloud/service/${service.id}`)}>
                        <SimpleServiceCard service={service} onDelete={() => handleDeleteService(service)} />
                      </div>
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="databases" pt="md">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={600} size="lg">
                  Cloud Databases
                </Text>
                <Button leftSection={<RiAddLine size={16} />} onClick={handleCreateDatabase} size="sm">
                  Create Database
                </Button>
              </Group>

              {databases.length === 0 ? (
                <Card p="xl" ta="center">
                  <Stack gap="md">
                    <Text size="lg" c="dimmed">
                      No cloud databases found
                    </Text>
                    <Text c="dimmed">Create your first cloud database to get started</Text>
                    <Button leftSection={<RiAddLine size={16} />} onClick={handleCreateDatabase} size="sm" variant="light">
                      Create Database
                    </Button>
                  </Stack>
                </Card>
              ) : (
                <Grid>
                  {databases.map((database) => (
                    <Grid.Col key={database.id} span={{ base: 12, sm: 12, md: 12, lg: 12 }}>
                      <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/account/cloud/database/${database.id}`)}>
                        <SimpleDatabaseCard database={database} onDelete={() => handleDeleteDatabase(database)} />
                      </div>
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Modals */}
      <DeleteServiceModal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} service={selectedService} />
      <DeleteDatabaseModal opened={dbDeleteModalOpened} onClose={() => setDbDeleteModalOpened(false)} database={selectedDatabase} />
    </Mounted>
  )
}
