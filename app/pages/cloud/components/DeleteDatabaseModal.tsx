import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import { useNavigate } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import { useDatabaseStore, type UserDatabase } from '~/lib/store/databaseStore'

interface DeleteDatabaseModalProps {
  opened: boolean
  onClose: () => void
  database: UserDatabase | null
}

export default function DeleteDatabaseModal({ opened, onClose, database }: DeleteDatabaseModalProps) {
  const { getAuthToken } = useAiStore()
  const { deleteDatabase } = useDatabaseStore()
  const navigate = useNavigate()

  const handleDelete = async () => {
    if (!database?.id) return

    const success = await deleteDatabase(database.database_uuid, getAuthToken())
    if (success) {
      onClose()
      navigate('/account/cloud')
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Delete Database" size="sm">
      <Stack gap="md">
        <Text>
          Are you sure you want to delete the database <strong>{(database as any)?.name || (database as any)?.response?.name || database?.type}</strong>? This action cannot be
          undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete}>
            Delete Database
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
