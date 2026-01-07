import { ActionIcon, Anchor, Badge, Card, Group, Image, Stack, Text, Tooltip } from '@mantine/core'
import { RiDeleteBinLine, RiExternalLinkLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import type { CloudService } from '~/lib/store/cloudStore'
import useCloudStore from '~/lib/store/cloudStore'

interface SimpleServiceCardProps {
  service: CloudService
  onDelete: () => void
}

export default function SimpleServiceCard({ service, onDelete }: SimpleServiceCardProps) {
  const { getAuthToken } = useAiStore()
  const { getServiceStatus } = useCloudStore()
  const [liveStatus, setLiveStatus] = useState<any>(null)

  // Fetch live service status
  const fetchLiveStatus = async () => {
    if (!service.service_id) return

    try {
      const statusData = await getServiceStatus(service.service_id, getAuthToken())
      setLiveStatus(statusData)
    } catch (error) {
      console.error('Error fetching live status:', error)
    }
  }

  // Fetch status on mount
  useEffect(() => {
    fetchLiveStatus()
  }, [service.service_id])

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

  // Check multiple possible status values for running state
  const rawStatus =
    liveStatus?.status?.toLowerCase() ||
    service.response?.status?.toLowerCase() ||
    service.response?.state?.toLowerCase() ||
    service.response?.health?.toLowerCase() ||
    service.response?.deployment_status?.toLowerCase() ||
    (service as any).status?.toLowerCase()

  // Handle Coolify status format like "running:healthy"
  const status = rawStatus?.includes(':') ? rawStatus.split(':')[0] : rawStatus

  return (
    <Card shadow="sm" padding="lg" radius="xs" h="100%">
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start">
          <Group gap="md" style={{ flex: 1 }}>
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group gap="xs" align="center">
                {service.cloud_service?.logo && (
                  <Image src={service.cloud_service.logo} alt={service.cloud_service.name} w={24} h={24} fit="contain" fallbackSrc="/placeholder-icon.png" />
                )}
                <Text fw={500} size="lg" lineClamp={1}>
                  {service.type || liveStatus?.name || service.response?.name || service.service_id || 'Unnamed Service'}
                </Text>
              </Group>
            </Stack>
          </Group>

          <Tooltip label="Delete Service">
            <ActionIcon
              c="red.5"
              variant="subtle"
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
          <Text size="xs" c="dimmed">
            {liveStatus?.name || liveStatus?.service_type || service.type || 'Unknown Type'}
          </Text>
          <Badge color={getStatusColor(status)} variant="light" size="sm">
            {getStatusText(status || rawStatus)}
          </Badge>
        </Group>

        {(liveStatus?.domains?.[0] || service.domain) && (
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Domain:
            </Text>
            <Anchor
              href={`${liveStatus?.domains?.[0] || service.domain}`}
              target="_blank"
              size="sm"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={(e) => e.stopPropagation()}
            >
              {liveStatus?.domains?.[0] || service.domain}
              <RiExternalLinkLine size={12} />
            </Anchor>
          </Group>
        )}

        {service.created_at && (
          <Text size="xs" c="dimmed" mt="auto">
            Created: {new Date(service.created_at).toLocaleDateString()}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
