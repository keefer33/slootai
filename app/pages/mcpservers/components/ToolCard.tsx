import { Avatar, Badge, Box, Button, Card, Group, Stack, Text } from '@mantine/core'
import { RiLink, RiLinkUnlink } from '@remixicon/react'
import { type Tool } from '~/shared/ToolCard'

interface ToolCardProps {
  tool: Tool
  isAttached: boolean
  onAttach: (tool: Tool) => void
  onDetach: (tool: Tool) => void
}

export function ToolCard({ tool, isAttached, onAttach, onDetach }: ToolCardProps) {
  // Early return if tool is null/undefined
  if (!tool || !tool.id) {
    return null
  }

  return (
    <Card key={tool.id} shadow="sm" padding="sm" radius="xs" withBorder>
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <Group gap="sm" align="center">
            {tool.avatar ? (
              <Avatar src={tool.avatar} alt={tool.tool_name || 'Tool'} size="sm" radius="sm" />
            ) : (
              <Avatar size="sm" radius="sm" color="gray">
                {tool.tool_name?.charAt(0)?.toUpperCase() || 'T'}
              </Avatar>
            )}
            <Box>
              <Group gap="xs" align="center">
                <Text fw={600} size="sm">
                  {tool.tool_name || 'Unnamed Tool'}
                </Text>
                {tool.is_sloot && (
                  <Badge size="xs" variant="light" color="green">
                    Sloot Tool
                  </Badge>
                )}
                {tool.is_pipedream && (
                  <Badge size="xs" variant="light" color="orange">
                    Pipedream Tool
                  </Badge>
                )}
                {!tool.is_sloot && !tool.is_pipedream && (
                  <Badge size="xs" variant="light" color="blue">
                    Custom Tool
                  </Badge>
                )}
              </Group>
              {tool.schema && (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {(() => {
                    const description =
                      typeof tool.schema === 'string'
                        ? (() => {
                            try {
                              return JSON.parse(tool.schema).description || 'No description'
                            } catch {
                              return 'Invalid schema'
                            }
                          })()
                        : tool.schema?.description || 'No description'

                    // Limit to 100 characters
                    return description.length > 50 ? description.substring(0, 50) + '...' : description
                  })()}
                </Text>
              )}
            </Box>
          </Group>
          <Group gap={4}>
            {isAttached ? (
              <Button size="xs" variant="light" color="red" leftSection={<RiLinkUnlink size={12} />} onClick={() => onDetach(tool)}>
                Detach
              </Button>
            ) : (
              <Button size="xs" variant="light" leftSection={<RiLink size={12} />} onClick={() => onAttach(tool)}>
                Attach
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Card>
  )
}
