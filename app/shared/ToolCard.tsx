import { ActionIcon, Avatar, Badge, Box, Button, Card, Group, Text, Title, useMantineColorScheme } from '@mantine/core'
import { RiArrowRightFill, RiDeleteBinLine } from '@remixicon/react'
import DeleteToolModal from '~/pages/tools/components/DeleteToolModal'

export interface Tool {
  id: string
  user_id?: string
  tool_name: string
  schema: object | null | any
  created_at: string
  response_id?: string
  messages?: Array<{ role: string; content: string }>
  user_connect_api_id?: string
  avatar?: string
  is_sloot?: boolean
  is_pipedream?: boolean
  sloot?: string // Additional JSON configuration for sloot tools
  pipedream?: object | null | any
}

interface ToolCardProps {
  tool: Tool
  onEdit?: (tool: Tool) => void
  onDelete?: (tool: Tool) => void
  onDetach?: (tool: Tool) => void
  onClick?: (tool: Tool) => void
  showActions?: boolean
  onToolDeleted?: () => void
}

export function ToolCard({ tool, onEdit, onDelete, onDetach, onClick, showActions = true, onToolDeleted }: ToolCardProps) {
  const { colorScheme } = useMantineColorScheme()

  const getToolTypeBadge = () => {
    if (tool.is_sloot) {
      return (
        <Badge size="xs" color="blue">
          Sloot
        </Badge>
      )
    } else if (tool.is_pipedream) {
      return (
        <Badge size="sm" variant="filled">
          {tool.pipedream?.app?.categories[0] ? tool.pipedream?.app?.categories[0] : 'Pipedream'}
        </Badge>
      )
    } else {
      return (
        <Badge size="xs" color="gray">
          User
        </Badge>
      )
    }
  }

  return (
    <Card shadow="sm" padding="sm" radius="xs" withBorder>
      <Card.Section bg={colorScheme === 'dark' ? 'dark.5' : 'gray.1'} p="xs">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Group gap="sm" align="center">
              {tool.avatar && (
                <Avatar src={tool.avatar} size="xs" radius="0">
                  {tool.tool_name.charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Group gap="xs" align="center">
                <Title order={6} lineClamp={1}>
                  {tool.tool_name}
                </Title>
              </Group>
            </Group>
          </Box>
        </Group>
      </Card.Section>

      <Card.Section p="xs">
        <Box h={50}>
          {tool.schema && (
            <Text size="sm" c="dimmed" fw={500} lineClamp={3}>
              {typeof tool.schema === 'string' ? JSON.parse(tool.schema).description : tool.schema?.description}
            </Text>
          )}
        </Box>
      </Card.Section>
      {/* Schema preview */}

      <Card.Section p="xs">
        <Box>
          <Group justify="space-between" align="center">
            {getToolTypeBadge()}
            {showActions && (onEdit || onDelete || onDetach) && (
              <Group gap={4}>
                {onDelete && <DeleteToolModal tool={tool} onToolDeleted={onToolDeleted} />}
                {onDetach && (
                  <ActionIcon
                    variant="subtle"
                    color="orange"
                    size="xs"
                    title="Detach Tool"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDetach(tool)
                    }}
                  >
                    <RiDeleteBinLine size={14} />
                  </ActionIcon>
                )}
                {onClick && (
                  <Button
                    variant="light"
                    size="xs"
                    title="Click to edit tool"
                    onClick={() => {
                      onClick(tool)
                    }}
                  >
                    Run Tool <RiArrowRightFill size={14} />
                  </Button>
                )}
              </Group>
            )}
          </Group>
        </Box>
      </Card.Section>
    </Card>
  )
}
