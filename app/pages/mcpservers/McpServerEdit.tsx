import { ActionIcon, Badge, Box, Button, Card, Grid, Group, ScrollArea, Stack, Text, TextInput } from '@mantine/core'
import { RiCloseLine, RiEditLine, RiSaveLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useLoaderData, useNavigate, useParams } from 'react-router'
import { showNotification } from '~/lib/notificationUtils'
import useMcpServersStore from '~/lib/store/mcpServersStore'
import useToolsStore from '~/lib/store/toolsStore'
import { getAvailableTools, getServer, getServerTools } from '~/lib/supaServerClient'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import { type Tool } from '~/shared/ToolCard'
import { GroupedTools } from './components/GroupedTools'
import { ToolCard } from './components/ToolCard'

export async function loader({ request, params }) {
  const { serverId } = params
  const { server, serverError }: any = await getServer(request, serverId)
  const { serverTools, serverToolsError }: any = await getServerTools(request, serverId)
  //const { slootTools, slootToolsError }: any = await getSlootTools(request)
  const { availableTools, availableToolsError }: any = await getAvailableTools(request)
  if (!server || !serverTools || !availableTools) {
    console.error('Error loading MCP servers:', serverError || serverToolsError || availableToolsError)
    return { mcpServers: [], error: serverError?.message || serverToolsError?.message || availableToolsError?.message }
  }
  return { serverId, server, serverTools, availableTools: availableTools }
}

export default function McpServerEdit() {
  const { serverId } = useParams()
  const { server = null, serverTools = [], availableTools = [] } = useLoaderData<typeof loader>()
  const { slootTools } = useToolsStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [serverName, setServerName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set())

  const {
    setServer,
    setServerTools,
    attachToolToServer,
    detachToolFromServer,
    updateMcpServer,
    unattachedTools,
    getAllAvailableTools,
    getServerTools,
    attachedTools,
    setAttachedTools,
    setUnattachedTools,
    setAvailableTools,
    loadMcpServer,
  } = useMcpServersStore()

  const loadData = async () => {
    try {
      setServerName(server?.server_name || '')
      setServer(server)
      setServerTools(serverTools)

      //need to filter out sloot tools from the available tools in case the person is an admin
      const availableToolsFiltered = availableTools.filter((tool) => !tool.is_sloot)
      setAvailableTools([...availableToolsFiltered, ...slootTools])
      //all available tools plus sloot tools

      //serverTools does not include the full tool object, so we need to get it from the available tools
      const serverToolIds = new Set(getServerTools().map((st) => st.user_tool_id))
      const serverToolsFiltered = getAllAvailableTools().filter((tool) => serverToolIds.has(tool.id))
      setAttachedTools(serverToolsFiltered)

      //then we minus out the the attached serverTools from the available tools
      const allAvailMinusServerTools = getAllAvailableTools().filter((tool) => !serverToolIds.has(tool.id))
      setUnattachedTools([...allAvailMinusServerTools])
    } catch (error) {
      console.error('Error loading data:', error)
      showNotification({ title: 'Error', message: 'Failed to load server data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (serverId) {
      loadData()
    }
  }, [serverId])

  const handleAttachTool = async (tool: Tool) => {
    if (!server) return

    try {
      await attachToolToServer(server.id, tool.id)
      // State is now managed by the store
    } catch (error) {
      console.error('Error attaching tool:', error)
      showNotification({ title: 'Error', message: 'Failed to attach tool', type: 'error' })
    }
  }

  const handleDetachTool = async (tool: Tool) => {
    if (!server) return

    // Find the server tool record that contains this tool by user_tool_id
    const serverTool = getServerTools().find((st) => st && st.user_tool_id === tool.id)
    if (!serverTool) {
      showNotification({ title: 'Error', message: 'Tool not found in server tools', type: 'error' })
      return
    }

    //deleting from the user_mcp_server_tools table by user_tool_id and user_mcp_server_id - need both ids to delete
    const success = await detachToolFromServer(serverTool.id)
    if (!success) {
      showNotification({ title: 'Error', message: 'Failed to detach tool', type: 'error' })
    }
    // State is now managed by the store
  }

  const handleSaveName = async () => {
    if (!server || !serverName.trim()) return

    setSavingName(true)
    try {
      const success = await updateMcpServer(server.id, { server_name: serverName.trim() })
      if (success) {
        setEditingName(false)
        await loadMcpServer(serverId!) // Reload to get updated data
        setServerName(serverName.trim())
      }
    } catch (error) {
      console.error('Error updating server name:', error)
      showNotification({ title: 'Error', message: 'Failed to update server name', type: 'error' })
    } finally {
      setSavingName(false)
    }
  }

  const handleCancelEdit = () => {
    setServerName(server?.server_name || '')
    setEditingName(false)
  }

  const toggleAppExpansion = (appName: string) => {
    setExpandedApps((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(appName)) {
        newSet.delete(appName)
      } else {
        newSet.add(appName)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <Mounted pageLoading={loading} size="xl">
        <PageTitle title="Loading..." text="Loading MCP server data..." />
        <Text>Loading...</Text>
      </Mounted>
    )
  }

  if (!server) {
    return (
      <Mounted pageLoading={false} size="xl">
        <PageTitle title="Server Not Found" text="The requested MCP server could not be found" />
        <Text>Server not found</Text>
      </Mounted>
    )
  }

  return (
    <Mounted pageLoading={loading} size="xl">
      {/* Server Header with Inline Editing */}
      <Card shadow="sm" padding="md" radius="md" mb="md">
        <Group justify="space-between" align="center">
          <Group gap="md" align="center">
            {editingName ? (
              <Group gap="xs" align="center">
                <TextInput value={serverName} onChange={(e) => setServerName(e.target.value)} size="lg" fw={600} style={{ minWidth: 200 }} />
                <ActionIcon color="green" variant="light" onClick={handleSaveName} loading={savingName}>
                  <RiSaveLine size={16} />
                </ActionIcon>
                <ActionIcon color="gray" variant="light" onClick={handleCancelEdit}>
                  <RiCloseLine size={16} />
                </ActionIcon>
              </Group>
            ) : (
              <Group gap="xs" align="center">
                <Text fw={600} size="lg">
                  {serverName}
                </Text>
                <ActionIcon variant="subtle" size="sm" onClick={() => setEditingName(true)}>
                  <RiEditLine size={16} />
                </ActionIcon>
              </Group>
            )}
            <Badge variant="light" color="blue">
              {server.type}
            </Badge>
          </Group>
          <Button variant="light" onClick={() => navigate('/account/mcpservers')}>
            ← Back to MCP Servers
          </Button>
        </Group>
      </Card>

      {/* Responsive Two Column Layout */}
      <Grid gutter="md">
        {/* Attached Tools - Shows first on mobile, second on desktop */}
        <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
          <Box p="md" h={{ base: '100%', md: 'calc(100vh - 185px)' }}>
            <Stack gap="md" h="100%">
              <Text fw={600} size="md">
                Attached Tools ({attachedTools.length})
              </Text>
              <ScrollArea h="100%">
                {attachedTools.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    No tools attached to this server.
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {attachedTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} isAttached={true} onAttach={handleAttachTool} onDetach={handleDetachTool} />
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Stack>
          </Box>
        </Grid.Col>

        {/* Available Tools - Shows second on mobile, first on desktop */}
        <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
          <Box p="md" h={{ base: '100%', md: 'calc(100vh - 185px)' }}>
            <Stack gap="md" h="100%">
              <Group justify="space-between">
                <Text fw={600} size="md">
                  Available Tools ({unattachedTools.length})
                </Text>
                <Group gap="xs">
                  <Badge variant="light" color="blue" size="sm">
                    {unattachedTools.filter((t) => !t.is_sloot && !t.is_pipedream).length} Custom
                  </Badge>
                  <Badge variant="light" color="green" size="sm">
                    {unattachedTools.filter((t) => t.is_sloot).length} Sloot
                  </Badge>
                  <Badge variant="light" color="orange" size="sm">
                    {unattachedTools.filter((t) => t.is_pipedream).length} Pipedream
                  </Badge>
                </Group>
              </Group>
              <ScrollArea h="100%">
                {unattachedTools.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    No available tools to attach. Create a new tool to get started.
                  </Text>
                ) : (
                  <GroupedTools
                    tools={unattachedTools}
                    isAttached={false}
                    expandedApps={expandedApps}
                    onToggleAppExpansion={toggleAppExpansion}
                    onAttach={handleAttachTool}
                    onDetach={handleDetachTool}
                  />
                )}
              </ScrollArea>
            </Stack>
          </Box>
        </Grid.Col>
      </Grid>
    </Mounted>
  )
}
