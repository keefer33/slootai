import { ActionIcon, Anchor, Badge, Box, Divider, Group, Menu, Stack, Text, Tooltip } from '@mantine/core'
import { RiDeleteBinLine, RiEditLine, RiExternalLinkLine, RiMoreLine, RiPlayLine, RiRestartLine, RiStopLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import { useDatabaseStore, type UserDatabase } from '~/lib/store/databaseStore'

// Utility function to clean SVG content
const cleanSvgContent = (svg: string): string => {
  return svg.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
}

interface DatabaseDetailCardProps {
  database: UserDatabase
  onDelete?: () => void
  onEdit?: () => void
  onStart?: () => void
  onStop?: () => void
  onRestart?: () => void
  showActions?: boolean
}

export default function DatabaseDetailCard({ database, onDelete, onEdit, onStart, onStop, onRestart, showActions = false }: DatabaseDetailCardProps) {
  const { getAuthToken } = useAiStore()
  const { databaseTemplates, currentPollingDatabase, pollingDatabaseUuid, startPolling, stopPolling, getDatabase } = useDatabaseStore()
  const location = useLocation()
  const [actionLoading, setActionLoading] = useState(false)

  // Check if we're still on the database detail page
  const isOnDatabaseDetailPage = () => {
    const pathname = location.pathname
    return pathname.startsWith('/account/cloud/database/') && pathname.split('/').length === 5
  }

  // Get the current database data (either from polling or props)
  const getCurrentDatabase = () => {
    if (pollingDatabaseUuid === database.database_uuid && currentPollingDatabase) {
      return { ...database, ...currentPollingDatabase }
    }
    return database
  }

  // Get status from response data
  const getStatus = () => {
    const currentDb = getCurrentDatabase()
    const status = (currentDb as any)?.status || (currentDb as any)?.response?.status || (currentDb as any)?.state || (currentDb as any)?.health || 'unknown'

    // Handle Coolify status format like "running:healthy"
    if (typeof status === 'string' && status.includes(':')) {
      return status.split(':')[0]
    }
    return status
  }

  // Get database info from polling response
  const getDatabaseInfo = () => {
    const currentDb = getCurrentDatabase()
    return (currentDb as any) || {}
  }

  // Get database template info from store
  const getDatabaseTemplate = () => {
    const currentDb = getCurrentDatabase()
    const dbType = currentDb?.type?.toLowerCase()
    return databaseTemplates.find((template) => template.id === dbType) || null
  }

  const getStatusColor = (status: string) => {
    if (status.includes('running')) return 'green'
    if (status.includes('stopped') || status.includes('exited')) return 'red'
    if (status.includes('starting')) return 'yellow'
    if (status.includes('stopping')) return 'orange'
    return 'gray'
  }

  const getStatusText = (status: string) => {
    if (status.includes('running')) return 'Running'
    if (status.includes('stopped') || status.includes('exited')) return 'Stopped'
    if (status.includes('starting')) return 'Starting'
    if (status.includes('stopping')) return 'Stopping'
    return 'Unknown'
  }

  // Start polling when component mounts
  useEffect(() => {
    if (database.database_uuid && isOnDatabaseDetailPage()) {
      startPolling(database.database_uuid, getAuthToken())
    }

    return () => {
      stopPolling()
    }
  }, [database.database_uuid, getAuthToken, startPolling, stopPolling])

  // Stop polling when URL changes
  useEffect(() => {
    if (!isOnDatabaseDetailPage()) {
      stopPolling()
    }
  }, [location.pathname, stopPolling])

  // Poll database status until it reaches target state
  const pollDatabaseStatus = async (targetState: 'running' | 'exited', maxAttempts = 30): Promise<boolean> => {
    if (!database.database_uuid) return false

    let attempts = 0
    const pollInterval = 2000 // Poll every 2 seconds

    while (attempts < maxAttempts) {
      try {
        const statusData = await getDatabase(database.database_uuid, getAuthToken())
        if ((statusData as any)?.status) {
          const currentStatus = (statusData as any).status.toLowerCase()
          const currentState = currentStatus.includes(':') ? currentStatus.split(':')[0] : currentStatus

          console.log(`Polling attempt ${attempts + 1}: current state = ${currentState}, target = ${targetState}`)

          if (currentState === targetState) {
            return true
          }
        }

        attempts++
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval))
        }
      } catch (error) {
        console.error('Error polling database status:', error)
        attempts++
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval))
        }
      }
    }

    console.warn(`Database did not reach target state '${targetState}' after ${maxAttempts} attempts`)
    return false
  }

  const status = getStatus()
  const statusColor = getStatusColor(status)
  const statusText = getStatusText(status)
  const dbInfo = getDatabaseInfo()
  const dbTemplate = getDatabaseTemplate()
  const currentDatabase = getCurrentDatabase()

  // Check if database is running
  const isRunning = status === 'running' || status === 'active' || status === 'started' || status === 'healthy'

  return (
    <>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="md">
            <Box>
              {dbTemplate?.logo ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: cleanSvgContent(dbTemplate.logo),
                  }}
                  style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px',
                    fontSize: '24px',
                  }}
                >
                  🗄️
                </div>
              )}
            </Box>
            <Stack gap="xs">
              <Text fw={600} size="xl">
                {dbInfo.name || dbTemplate?.name || 'Unknown Database'}
              </Text>
            </Stack>
          </Group>
          {showActions && (
            <Group gap="xs">
              <Tooltip label={isRunning ? 'Stop Database' : 'Start Database'}>
                <ActionIcon
                  variant="subtle"
                  color={isRunning ? 'red' : 'green'}
                  size="lg"
                  loading={actionLoading}
                  onClick={async (e) => {
                    e.stopPropagation()
                    const databaseUuid = database.database_uuid
                    const action = isRunning ? 'stop' : 'start'
                    const targetState = isRunning ? 'exited' : 'running'

                    console.log('Database action clicked:', { action, databaseUuid, database })

                    setActionLoading(true)
                    try {
                      // Execute the action
                      if (action === 'start') {
                        await onStart?.()
                      } else {
                        await onStop?.()
                      }

                      // Poll until database reaches target state
                      console.log(`Waiting for database to reach '${targetState}' state...`)
                      const success = await pollDatabaseStatus(targetState)

                      if (success) {
                        console.log(`Database successfully reached '${targetState}' state`)
                      } else {
                        console.warn(`Database did not reach '${targetState}' state within timeout`)
                      }
                    } catch (error) {
                      console.error('Database action failed:', error)
                    } finally {
                      setActionLoading(false)
                    }
                  }}
                >
                  {!actionLoading && (isRunning ? <RiStopLine size={24} /> : <RiPlayLine size={24} />)}
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Restart Database">
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  size="lg"
                  loading={actionLoading}
                  onClick={async (e) => {
                    e.stopPropagation()

                    setActionLoading(true)
                    try {
                      // Execute restart action
                      await onRestart?.()

                      // Poll until database reaches running state
                      console.log('Waiting for database to restart and reach running state...')
                      const success = await pollDatabaseStatus('running')

                      if (success) {
                        console.log('Database successfully restarted and is running')
                      } else {
                        console.warn('Database did not reach running state after restart within timeout')
                      }
                    } catch (error) {
                      console.error('Database restart failed:', error)
                    } finally {
                      setActionLoading(false)
                    }
                  }}
                >
                  {!actionLoading && <RiRestartLine size={24} />}
                </ActionIcon>
              </Tooltip>

              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" size="lg" onClick={(e) => e.stopPropagation()}>
                    <RiMoreLine size={24} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item leftSection={<RiEditLine size={14} />} onClick={onEdit}>
                    Edit Database
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item leftSection={<RiDeleteBinLine size={14} />} color="red" onClick={onDelete}>
                    Delete Database
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          )}
        </Group>

        {/* Status */}
        <Group gap="xs">
          <Badge variant="filled" color={statusColor} size="lg">
            {statusText}
            {pollingDatabaseUuid === database.database_uuid && (
              <Text component="span" ml="xs">
                ●
              </Text>
            )}
          </Badge>
        </Group>

        <Divider />

        {/* Database Details */}
        <Stack gap="sm">
          <Text fw={600} size="md">
            Database Details
          </Text>

          <Group gap="xl">
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                Database Type
              </Text>
              <Group gap="xs">
                <Text size="sm">{dbTemplate?.name || currentDatabase.type || 'Unknown'}</Text>
                {dbTemplate?.home_url && (
                  <Anchor href={dbTemplate.home_url} target="_blank" rel="noopener noreferrer" size="sm" c="blue" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RiExternalLinkLine size={12} />
                    Website
                  </Anchor>
                )}
              </Group>
            </Stack>

            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                Public Port
              </Text>
              <Text size="sm">{dbInfo.public_port || currentDatabase.public_port || 'N/A'}</Text>
            </Stack>

            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                Username
              </Text>
              <Text size="sm">{dbInfo.postgres_user}</Text>
            </Stack>

            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                Database Name
              </Text>
              <Text size="sm">{dbInfo.postgres_db}</Text>
            </Stack>
          </Group>

          <Group gap="md">
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                External URL
              </Text>
              <Text size="sm" style={{ wordBreak: 'break-all' }}>
                {dbInfo.external_db_url || currentDatabase.external_db_url || 'N/A'}
              </Text>
            </Stack>

            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                Internal URL
              </Text>
              <Text size="sm" style={{ wordBreak: 'break-all' }}>
                {dbInfo.internal_db_url || currentDatabase.internal_db_url || 'N/A'}
              </Text>
            </Stack>
          </Group>

          {dbInfo.started_at && (
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">
                Started At
              </Text>
              <Text size="sm">{new Date(dbInfo.started_at).toLocaleString()}</Text>
            </Stack>
          )}
        </Stack>
      </Stack>
    </>
  )
}
