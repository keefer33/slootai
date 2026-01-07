import { ActionIcon, Anchor, Badge, Divider, Group, Image, Menu, Stack, Text, Tooltip } from '@mantine/core'
import { RiCalendarLine, RiDeleteBinLine, RiEditLine, RiExternalLinkLine, RiFlagLine, RiMoreLine, RiPlayLine, RiRefreshLine, RiSettingsLine, RiStopLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import type { CloudService } from '~/lib/store/cloudStore'
import useCloudStore from '~/lib/store/cloudStore'
import { PageTitle } from '~/shared/PageTitle'

interface ServiceCardProps {
  service: CloudService
  onEdit: () => void
  onDelete: () => void
  onManageEnvironments: () => void
  onServiceAction: (action: 'start' | 'stop' | 'restart', serviceId: string) => void
}

export default function ServiceCard({ service, onEdit, onDelete, onManageEnvironments, onServiceAction }: ServiceCardProps) {
  const { getAuthToken } = useAiStore()
  const { currentPollingService, pollingServiceId, startPolling, stopPolling } = useCloudStore()
  const [actionLoading, setActionLoading] = useState(false)
  // Get the current service data (either from polling or props)
  const getCurrentService = () => {
    if (pollingServiceId === service.service_id && currentPollingService) {
      return { ...service, ...currentPollingService }
    }
    return service
  }

  // Start polling when component mounts
  useEffect(() => {
    if (service.service_id) {
      startPolling(service.service_id, getAuthToken())
    }

    return () => {
      stopPolling()
    }
  }, [service.service_id, getAuthToken, startPolling, stopPolling])

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

  // Get current service data
  const currentService = getCurrentService()

  // Check multiple possible status values for running state
  const rawStatus =
    (currentService as any)?.status?.toLowerCase() ||
    currentService?.response?.status?.toLowerCase() ||
    currentService?.response?.state?.toLowerCase() ||
    currentService?.response?.health?.toLowerCase() ||
    currentService?.response?.deployment_status?.toLowerCase() ||
    (currentService as any).status?.toLowerCase()

  // Handle Coolify status format like "running:healthy"
  const status = rawStatus?.includes(':') ? rawStatus.split(':')[0] : rawStatus

  const isRunning = status === 'running' || status === 'active' || status === 'started' || status === 'healthy' || status === 'deployed'

  return (
    <>
      <Stack gap="md">
        <PageTitle
          title={`Service: ${currentService.cloud_service?.name || currentService.domain || currentService.service_id || 'Unnamed Service'}`}
          text={currentService.cloud_service?.description || 'View and manage your cloud service'}
        />
        {/* Header Section */}
        <Group justify="space-between" align="flex-start">
          <Group gap="md" style={{ flex: 1 }}>
            {currentService.cloud_service?.logo && (
              <Image src={currentService.cloud_service.logo} alt={currentService.cloud_service.name} w={60} h={60} fit="contain" fallbackSrc="/placeholder-icon.png" radius="md" />
            )}
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text fw={600} size="xl" lineClamp={1}>
                {(currentService as any)?.name || currentService.response?.name || currentService.service_id || 'Unnamed Service'}
              </Text>
              <Text size="md" c="dimmed" lineClamp={2}>
                {currentService.cloud_service?.description ||
                  (currentService as any)?.description ||
                  currentService.response?.description ||
                  currentService.type ||
                  'No description'}
              </Text>
              {currentService.cloud_service?.category && (
                <Badge color="blue" variant="light" size="sm" leftSection={<RiFlagLine size={12} />}>
                  {currentService.cloud_service.category}
                </Badge>
              )}
            </Stack>
          </Group>

          <Group gap="md">
            <Tooltip label={isRunning ? 'Stop Service' : 'Start Service'}>
              <ActionIcon
                variant="subtle"
                color={isRunning ? 'red' : 'green'}
                size="lg"
                loading={actionLoading}
                onClick={async (e) => {
                  e.stopPropagation()
                  const serviceId = service.service_id || service.id
                  const action = isRunning ? 'stop' : 'start'

                  console.log('Service action clicked:', { action, serviceId, service })

                  setActionLoading(true)
                  try {
                    // Execute the action
                    await onServiceAction(action, serviceId)
                    // The store's polling will automatically update the status
                  } catch (error) {
                    console.error('Service action failed:', error)
                  } finally {
                    setActionLoading(false)
                  }
                }}
              >
                {!actionLoading && (isRunning ? <RiStopLine size={24} /> : <RiPlayLine size={24} />)}
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Restart Service">
              <ActionIcon
                variant="subtle"
                color="blue"
                size="lg"
                loading={actionLoading}
                onClick={async (e) => {
                  e.stopPropagation()
                  const serviceId = service.service_id || service.id

                  setActionLoading(true)
                  try {
                    // Execute restart action
                    await onServiceAction('restart', serviceId)
                    // The store's polling will automatically update the status
                  } catch (error) {
                    console.error('Service restart failed:', error)
                  } finally {
                    setActionLoading(false)
                  }
                }}
              >
                {!actionLoading && <RiRefreshLine size={24} />}
              </ActionIcon>
            </Tooltip>
          </Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="lg" onClick={(e) => e.stopPropagation()}>
                <RiMoreLine size={24} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<RiEditLine size={14} />} onClick={onEdit}>
                Edit Service
              </Menu.Item>
              <Menu.Item leftSection={<RiSettingsLine size={14} />} onClick={onManageEnvironments}>
                Manage Environments
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<RiDeleteBinLine size={14} />} color="red" onClick={onDelete}>
                Delete Service
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          {/* Status and Type Section */}
          <Group justify="end" align="center">
            <Group gap="xs" align="center">
              <Badge color={getStatusColor(status)} variant="filled" size="lg">
                {getStatusText(status)}
              </Badge>
            </Group>
          </Group>
        </Group>

        {/* Domain Section */}
        {((currentService as any)?.domains?.[0] || currentService.domain) && (
          <>
            <Divider />
            <Stack gap="md">
              <Text fw={600} size="lg" c="dimmed">
                Access
              </Text>
              <Group gap="xs">
                <Text size="sm" fw={500} c="dimmed">
                  Domain:
                </Text>
                <Anchor
                  href={`${(currentService as any)?.domains?.[0] || currentService.domain}`}
                  target="_blank"
                  size="md"
                  fw={500}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {(currentService as any)?.domains?.[0] || currentService.domain}
                  <RiExternalLinkLine size={14} />
                </Anchor>
              </Group>
            </Stack>
          </>
        )}

        {/* Template Information */}
        {service.cloud_service && (
          <>
            <Divider />
            <Stack gap="md">
              <Text fw={600} size="lg" c="dimmed">
                Template Information
              </Text>
              <Group gap="xl">
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="dimmed">
                    Template Name
                  </Text>
                  <Text size="sm">{service.cloud_service.name}</Text>
                </Stack>
                {service.cloud_service.category && (
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      Category
                    </Text>
                    <Badge color="blue" variant="light">
                      {service.cloud_service.category}
                    </Badge>
                  </Stack>
                )}
                {service.cloud_service.home_url && (
                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="dimmed">
                      Home URL
                    </Text>
                    <Anchor
                      href={service.cloud_service.home_url}
                      target="_blank"
                      size="sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Documentation
                      <RiExternalLinkLine size={12} />
                    </Anchor>
                  </Stack>
                )}
              </Group>
              {service.cloud_service.tags && service.cloud_service.tags.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={500} c="dimmed">
                    Tags
                  </Text>
                  <Group gap="xs">
                    {service.cloud_service.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              )}
            </Stack>
          </>
        )}

        {/* Action Buttons */}
        <Divider />
        <Group justify="space-between" align="center">
          {/* Timestamps */}
          <Group gap="md">
            {service.created_at && (
              <Group gap="xs">
                <RiCalendarLine size={14} />
                <Text size="xs" c="dimmed">
                  Created: {new Date(service.created_at).toLocaleDateString()}
                </Text>
              </Group>
            )}
            {service.updated_at && (
              <Group gap="xs">
                <RiCalendarLine size={14} />
                <Text size="xs" c="dimmed">
                  Updated: {new Date(service.updated_at).toLocaleDateString()}
                </Text>
              </Group>
            )}
          </Group>
        </Group>
      </Stack>
    </>
  )
}
