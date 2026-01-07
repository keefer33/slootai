import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core'
import { RiArrowRightSLine } from '@remixicon/react'
import { Link } from 'react-router'
import { formatDate } from '~/lib/utils'
import AgentCodeExample from './AgentCodeExample'
import AgentDelete from './AgentDelete'
import AgentEdit from './AgentEdit'

export default function AgentCard({ model }) {
  // Add fallbacks for missing model data
  const modelBrand = model?.brand || 'Unknown'
  const displayName = model?.name || 'Unnamed Agent'
  return (
    <Card shadow="sm" padding="sm" radius="xs">
      <Stack gap="0">
        {/* Header with name and actions */}
        <Group gap="xs" align="center" justify="space-between" w="100%">
          <Stack gap="xs">
            <Group gap="xs">
              <Text fw={600} size="lg">
                {displayName}
              </Text>
              <Group gap={4}>
                <AgentEdit model={model} />
                <AgentDelete model={model} />
              </Group>
            </Group>
            <Badge variant="light" color={modelBrand?.toLowerCase() === 'openai' ? 'green' : modelBrand?.toLowerCase() === 'anthropic' ? 'orange' : 'blue'} size="md">
              {model.model?.model}
            </Badge>
          </Stack>
          <Stack gap="0" justify="end">
            <Group gap={4} justify="end">
              <AgentCodeExample model={model} />
              <Link to={`/account/agents/${model.id}`} style={{ textDecoration: 'none' }}>
                <Button variant="light" size="xs" title="Open Agent" rightSection={<RiArrowRightSLine size={20} />}>
                  Playground
                </Button>
              </Link>
            </Group>

            <Text size="xs" c="dimmed">
              Created: {formatDate(model.created_at)}
            </Text>
          </Stack>
        </Group>
        {/* Description */}
        {model.description && (
          <Text size="sm" c="dimmed" mt="xs">
            {model.description}
          </Text>
        )}

        {/* API Key Section 
        <Stack gap="xs" mt="md">
          <ApiKey apiKey={currentApiKey} entityId={model.id} entityName={displayName} tableName="user_models" onApiKeyUpdate={setCurrentApiKey} />
        </Stack>
        */}
      </Stack>
    </Card>
  )
}
