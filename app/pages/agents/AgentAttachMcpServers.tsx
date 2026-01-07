import { ActionIcon, Badge, Button, Card, Group, Modal, Stack, Text } from '@mantine/core'
import { RiAddLine, RiCloseLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useFormContext } from '~/lib/ContextForm'
import useAgentsUtils from '~/lib/hooks/useAgentsUtils'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import useMcpServersStore from '~/lib/store/mcpServersStore'
import useToolsStore from '~/lib/store/toolsStore'
import { formatDate } from '~/lib/utils'
import { ToolPromptGenerator } from '~/shared/ToolPromptGenerator'

interface UserModel {
  id: string
  name: string
  // Add other user model fields as needed
}

interface AgentAttachMcpServersProps {
  userModel: UserModel
}

export function AgentAttachMcpServers({ userModel }: AgentAttachMcpServersProps) {
  const [serverTools, setServerTools] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)
  const [modalOpened, setModalOpened] = useState(false)
  const { getSelectedAgent, setSelectedAgent } = useAiStore()

  const { loadServerTools, getAttachedMcpServers, getUnattachedMcpServers, setAttachedMcpServers, setUnattachedMcpServers, getMcpServers } = useMcpServersStore()
  const { savePayload } = useAgentsUtils()
  const form = useFormContext()
  const { slootTools } = useToolsStore()

  const init = async () => {
    //await loadMcpServers()
    loadAttachedServers()
  }

  const loadAttachedServers = async () => {
    setLoading(true)
    try {
      const { attached, unattached } = getMcpServers()?.reduce(
        (acc, server) => {
          if (getSelectedAgent()?.settings?.mcp_servers?.includes(server.id)) {
            acc.attached.push(server)
          } else {
            acc.unattached.push(server)
          }
          return acc
        },
        { attached: [], unattached: [] },
      )
      setAttachedMcpServers(attached)
      setUnattachedMcpServers(unattached)

      const toolsData: Record<string, any[]> = {}
      for (const server of attached) {
        const tools = await loadServerTools(server.id)
        tools.map((tool, index) => {
          if (!tool.tool) {
            tools[index].tool = slootTools.find((t) => t.id === tool.user_tool_id)
          }
        })
        toolsData[server.id] = tools
      }
      setServerTools(toolsData)
    } catch (error) {
      console.error('Error loading attached servers:', error)
      showNotification({ title: 'Error', message: 'Failed to load attached servers', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const attachServer = async (serverId: string) => {
    setSelectedAgent({
      ...getSelectedAgent(),
      settings: {
        ...getSelectedAgent().settings,
        mcp_servers: [...(getSelectedAgent()?.settings?.mcp_servers || []), serverId],
      },
    })

    await loadAttachedServers()
    await savePayload(form.getValues())
    return true
  }

  const detachServer = async (attachmentId: string) => {
    setSelectedAgent({
      ...getSelectedAgent(),
      settings: {
        ...getSelectedAgent().settings,
        mcp_servers: getSelectedAgent().settings.mcp_servers.filter((server) => server !== attachmentId),
      },
    })
    await loadAttachedServers()
    await savePayload(form.getValues())
    return true
  }

  const openModal = () => {
    setModalOpened(true)
  }

  const closeModal = () => {
    setModalOpened(false)
    // Reload attached servers when modal closes
    loadAttachedServers()
  }

  useEffect(() => {
    setLoading(true)
    init()
  }, [])

  return (
    <>
      <Button loading={loading} justify="space-between" fullWidth variant="light" rightSection={<RiAddLine size={24} />} onClick={openModal}>
        Custom MCP ({getAttachedMcpServers().length})
      </Button>

      {/* Display attached servers with their tools */}
      {getAttachedMcpServers().length > 0 && (
        <Stack gap="xs">
          {getAttachedMcpServers().map((server) => {
            const tools = serverTools[server.id] || []
            return (
              <Card key={server.id} p="xs" shadow="sm" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {server.server_name}
                    </Text>
                    <ActionIcon variant="light" color="red.5" size="sm" onClick={() => detachServer(server.id)} title="Detach server">
                      <RiCloseLine size={14} />
                    </ActionIcon>
                  </Group>

                  {tools.length > 0 ? (
                    <Group gap="xs" wrap="wrap">
                      {tools.map((tool) => (
                        <ToolPromptGenerator key={tool.id} tool={tool.tool} />
                      ))}
                    </Group>
                  ) : (
                    ''
                  )}
                </Stack>
              </Card>
            )
          })}
        </Stack>
      )}
      <Modal opened={modalOpened} onClose={closeModal} title={`Attach MCP Servers - ${userModel?.name}`} size="lg">
        <Stack gap="md">
          {/* Attached Servers */}
          <Stack gap="md">
            <Text fw={500} size="sm">
              Attached MCP Servers ({getAttachedMcpServers().length})
            </Text>
            {loading ? (
              <Text size="sm" c="dimmed">
                Loading attached servers...
              </Text>
            ) : getAttachedMcpServers().length === 0 ? (
              <Text size="sm" c="dimmed">
                No MCP servers attached to this model.
              </Text>
            ) : (
              <Stack gap="xs">
                {getAttachedMcpServers().map((attachment) => (
                  <Card key={attachment.id} p="xs" shadow="sm">
                    <Group justify="space-between">
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>
                          {attachment.server_name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {attachment.server_url}
                        </Text>
                        <Group gap="xs">
                          <Badge variant="light" color={attachment.type === 'public' ? 'green' : attachment.type === 'connect' ? 'orange' : 'blue'} size="xs">
                            {attachment.type === 'public' ? 'Public' : attachment.type === 'connect' ? 'Connect' : 'Private'}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            Created: {formatDate(attachment.created_at)}
                          </Text>
                        </Group>
                      </Stack>
                      <ActionIcon variant="light" color="red.5" size="sm" onClick={() => detachServer(attachment.id)} title="Detach server">
                        <RiCloseLine size={14} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>

          {/* Available Servers to Attach */}
          <Stack gap="md">
            <Text fw={500} size="sm">
              Available MCP Servers ({getUnattachedMcpServers().length})
            </Text>
            {loading ? (
              <Text size="sm" c="dimmed">
                Loading available servers...
              </Text>
            ) : getUnattachedMcpServers().length === 0 ? (
              <Text size="sm" c="dimmed">
                No available MCP servers to attach.
              </Text>
            ) : (
              <Stack gap="xs">
                {getUnattachedMcpServers().map((server) => (
                  <Card key={server.id} p="xs" shadow="sm">
                    <Group justify="space-between">
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>
                          {server.server_name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {server.server_url}
                        </Text>
                        <Group gap="xs">
                          <Badge variant="light" color={server.type === 'public' ? 'green' : server.type === 'connect' ? 'orange' : 'blue'} size="xs">
                            {server.type === 'public' ? 'Public' : server.type === 'connect' ? 'Connect' : 'Private'}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            Created: {formatDate(server.created_at)}
                          </Text>
                        </Group>
                      </Stack>
                      <Button size="xs" variant="light" leftSection={<RiAddLine size={14} />} onClick={() => attachServer(server.id.toString())}>
                        Attach
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
