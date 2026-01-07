import { Avatar, Badge, Box, Card, Collapse, Group, Stack, Text } from '@mantine/core'
import { RiArrowDownSLine, RiArrowRightSLine } from '@remixicon/react'
import { type Tool } from '~/shared/ToolCard'
import { ToolCard } from './ToolCard'

interface GroupedToolsProps {
  tools: Tool[]
  isAttached: boolean
  expandedApps: Set<string>
  onToggleAppExpansion: (appName: string) => void
  onAttach: (tool: Tool) => void
  onDetach: (tool: Tool) => void
}

export function GroupedTools({ tools, isAttached, expandedApps, onToggleAppExpansion, onAttach, onDetach }: GroupedToolsProps) {
  // Group Pipedream tools by app name
  const groupPipedreamTools = (tools: Tool[]) => {
    const groups: Record<string, Tool[]> = {}

    tools.forEach((tool) => {
      if (tool.is_pipedream && tool.pipedream) {
        try {
          const pipedreamData = typeof tool.pipedream === 'string' ? JSON.parse(tool.pipedream) : tool.pipedream

          const appName = pipedreamData?.app?.name || 'Unknown App'

          if (!groups[appName]) {
            groups[appName] = []
          }
          groups[appName].push(tool)
        } catch (error) {
          console.error('Error parsing pipedream data:', error)
          const appName = 'Unknown App'
          if (!groups[appName]) {
            groups[appName] = []
          }
          groups[appName].push(tool)
        }
      }
    })

    return groups
  }

  const customTools = tools.filter((tool) => !tool.is_sloot && !tool.is_pipedream)
  const slootTools = tools.filter((tool) => tool.is_sloot && !tool.is_pipedream)
  const pipedreamTools = tools.filter((tool) => tool.is_pipedream)
  const pipedreamGroups = groupPipedreamTools(pipedreamTools)
  return (
    <Stack gap="xs">
      {/* Custom Tools */}
      {customTools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} isAttached={isAttached} onAttach={onAttach} onDetach={onDetach} />
      ))}

      {/* Sloot Tools */}
      {slootTools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} isAttached={isAttached} onAttach={onAttach} onDetach={onDetach} />
      ))}

      {/* Pipedream Tools - Grouped by App */}
      {Object.entries(pipedreamGroups).map(([appName, appTools]) => {
        const isExpanded = expandedApps.has(appName)

        return (
          <Box key={appName}>
            <Card shadow="sm" padding="sm" radius="xs" withBorder style={{ cursor: 'pointer' }} onClick={() => onToggleAppExpansion(appName)}>
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <Group gap="sm" align="center">
                    {appTools[0].avatar ? (
                      <Avatar src={appTools[0].avatar} alt={appTools[0].tool_name || 'Tool'} size="sm" radius="sm" />
                    ) : (
                      <Avatar size="sm" radius="sm" color="gray">
                        {appTools[0].tool_name?.charAt(0)?.toUpperCase() || 'T'}
                      </Avatar>
                    )}
                    <Box>
                      <Group gap="xs" align="center">
                        <Text fw={600} size="sm">
                          {appName}
                        </Text>
                        <Badge size="xs" variant="light" color="orange">
                          {appTools.length} tools
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        Pipedream App
                      </Text>
                    </Box>
                  </Group>
                  <Group gap={4}>{isExpanded ? <RiArrowDownSLine size={24} /> : <RiArrowRightSLine size={24} />}</Group>
                </Group>
              </Stack>
            </Card>

            <Collapse in={isExpanded}>
              <Stack gap="xs" pl="xs" pt="xs">
                {appTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} isAttached={isAttached} onAttach={onAttach} onDetach={onDetach} />
                ))}
              </Stack>
            </Collapse>
          </Box>
        )
      })}
    </Stack>
  )
}
