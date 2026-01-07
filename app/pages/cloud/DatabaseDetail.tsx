import { Button, Card, Center, Group, Loader, Stack, Text } from '@mantine/core'
import { RiArrowLeftLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import { useDatabaseStore } from '~/lib/store/databaseStore'
import Mounted from '~/shared/Mounted'
import DatabaseDetailCard from './components/DatabaseDetailCard'
import DeleteDatabaseModal from './components/DeleteDatabaseModal'
import EditDatabaseModal from './components/EditDatabaseModal'

export default function DatabaseDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user, getAuthToken } = useAiStore()
  const {
    deleteModalOpened,
    editModalOpened,
    getDatabaseById,
    startDatabase,
    stopDatabase,
    restartDatabase,
    setDeleteModalOpened,
    setEditModalOpened,
    setSelectedDatabase,
    loadDatabaseTemplates,
    stopPolling,
  } = useDatabaseStore()
  const [database, setDatabase] = useState(null)
  const [databaseLoading, setDatabaseLoading] = useState(true)

  useEffect(() => {
    const loadDatabase = async () => {
      if (user?.id && id) {
        setDatabaseLoading(true)
        try {
          const databaseData = await getDatabaseById(id, getAuthToken())
          if (databaseData) {
            setDatabase(databaseData)
          }
        } catch (error) {
          console.error('Error loading database:', error)
        } finally {
          setDatabaseLoading(false)
        }
      }
    }

    loadDatabase()
    loadDatabaseTemplates() // Load database templates for the detail card
  }, [user?.id, id, loadDatabaseTemplates])

  // Cleanup polling when component unmounts
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  const currentDatabase = database

  const handleBack = () => {
    // Stop polling before navigating away
    stopPolling()
    navigate('/account/cloud')
  }

  const handleDeleteDatabase = () => {
    setSelectedDatabase(currentDatabase)
    setDeleteModalOpened(true)
  }

  const handleEditDatabase = () => {
    setSelectedDatabase(currentDatabase)
    setEditModalOpened(true)
  }

  const handleStartDatabase = async () => {
    if (currentDatabase?.database_uuid) {
      const success = await startDatabase(currentDatabase.database_uuid, getAuthToken())
      if (success) {
        // Optionally refresh the database data
        const updatedDatabase = await getDatabaseById(id, getAuthToken())
        if (updatedDatabase) {
          setDatabase(updatedDatabase)
        }
      }
    }
  }

  const handleStopDatabase = async () => {
    if (currentDatabase?.database_uuid) {
      const success = await stopDatabase(currentDatabase.database_uuid, getAuthToken())
      if (success) {
        // Optionally refresh the database data
        const updatedDatabase = await getDatabaseById(id, getAuthToken())
        if (updatedDatabase) {
          setDatabase(updatedDatabase)
        }
      }
    }
  }

  const handleRestartDatabase = async () => {
    if (currentDatabase?.database_uuid) {
      const success = await restartDatabase(currentDatabase.database_uuid, getAuthToken())
      if (success) {
        // Optionally refresh the database data
        const updatedDatabase = await getDatabaseById(id, getAuthToken())
        if (updatedDatabase) {
          setDatabase(updatedDatabase)
        }
      }
    }
  }

  if (databaseLoading) {
    return (
      <Center h="50vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading database details...</Text>
        </Stack>
      </Center>
    )
  }

  if (!currentDatabase) {
    return (
      <Mounted pageLoading={databaseLoading} size="md">
        <Stack gap="lg">
          <Button variant="subtle" leftSection={<RiArrowLeftLine size={16} />} onClick={handleBack}>
            Back to Cloud Services
          </Button>
          <Card p="xl" ta="center">
            <Stack gap="md">
              <Text size="lg" c="dimmed">
                Database not found
              </Text>
              <Text c="dimmed">The requested database could not be found</Text>
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
    <Mounted pageLoading={databaseLoading} size="md">
      <Stack gap="xs">
        <Group>
          <Button variant="subtle" leftSection={<RiArrowLeftLine size={16} />} onClick={handleBack}>
            Back to Cloud Services
          </Button>
        </Group>
        <DatabaseDetailCard
          database={currentDatabase}
          onDelete={handleDeleteDatabase}
          onEdit={handleEditDatabase}
          onStart={handleStartDatabase}
          onStop={handleStopDatabase}
          onRestart={handleRestartDatabase}
          showActions={true}
        />
      </Stack>

      {/* Modals */}
      <EditDatabaseModal opened={editModalOpened} onClose={() => setEditModalOpened(false)} database={currentDatabase} />
      <DeleteDatabaseModal opened={deleteModalOpened} onClose={() => setDeleteModalOpened(false)} database={currentDatabase} />
    </Mounted>
  )
}
