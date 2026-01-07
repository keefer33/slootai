import { ActionIcon, Anchor, Badge, Card, Group, Stack, Text, Tooltip } from '@mantine/core'
import { RiDeleteBinLine, RiExternalLinkLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import { useDatabaseStore, type UserDatabase } from '~/lib/store/databaseStore'

interface SimpleDatabaseCardProps {
  database: UserDatabase
  onDelete: () => void
}

export default function SimpleDatabaseCard({ database, onDelete }: SimpleDatabaseCardProps) {
  const { getAuthToken } = useAiStore()
  const { getDatabase } = useDatabaseStore()
  const [liveStatus, setLiveStatus] = useState<any>(null)

  // Fetch live database status
  const fetchLiveStatus = async () => {
    if (!database.database_uuid) return

    try {
      const statusData = await getDatabase(database.database_uuid, getAuthToken())
      setLiveStatus(statusData)
    } catch (error) {
      console.error('Error fetching live status:', error)
    }
  }

  // Fetch status on mount
  useEffect(() => {
    fetchLiveStatus()
  }, [database.database_uuid])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'green'
      case 'exited':
      case 'stopped':
        return 'red'
      case 'starting':
        return 'yellow'
      case 'stopping':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const getStatusText = (status: string) => {
    return status || 'Unknown'
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'postgresql':
        return 'blue'
      case 'mysql':
        return 'orange'
      case 'mariadb':
        return 'cyan'
      case 'mongodb':
        return 'green'
      case 'redis':
        return 'red'
      case 'keydb':
        return 'yellow'
      case 'dragonfly':
        return 'purple'
      case 'clickhouse':
        return 'teal'
      default:
        return 'gray'
    }
  }

  // Check multiple possible status values for running state
  const rawStatus =
    liveStatus?.status?.toLowerCase() ||
    database.response?.status?.toLowerCase() ||
    database.response?.state?.toLowerCase() ||
    database.response?.health?.toLowerCase() ||
    (database as any).status?.toLowerCase()

  // Handle Coolify status format like "running:healthy"
  const status = rawStatus?.includes(':') ? rawStatus.split(':')[0] : rawStatus

  return (
    <Card shadow="sm" padding="lg" radius="xs" h="100%">
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text fw={500} size="lg" lineClamp={1}>
              {database.config?.name || database.type || 'Unnamed Database'}
            </Text>
            {database.config?.description && (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {database.config?.description}
              </Text>
            )}
          </Stack>

          <Tooltip label="Delete Database">
            <ActionIcon
              variant="subtle"
              color="red.5"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <RiDeleteBinLine size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Group justify="space-between" align="center">
          <Badge color={getTypeColor(database.type || '')} variant="light" size="sm">
            {database.type || 'Unknown Type'}
          </Badge>
          <Badge color={getStatusColor(status)} variant="light" size="sm">
            {getStatusText(status || rawStatus)}
          </Badge>
        </Group>

        {database.external_db_url && (
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              URL:
            </Text>
            <Anchor href={database.external_db_url} target="_blank" size="sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
              {database.external_db_url}
              <RiExternalLinkLine size={12} />
            </Anchor>
          </Group>
        )}

        {database.created_at && (
          <Text size="xs" c="dimmed" mt="auto">
            Created: {new Date(database.created_at).toLocaleDateString()}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
