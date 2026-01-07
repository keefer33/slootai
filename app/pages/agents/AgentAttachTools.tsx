import { Badge, Button, Group, Modal, Stack, Text, Title } from '@mantine/core'
import { RiAddLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useFormContext } from '~/lib/ContextForm'
import useAgentUtils from '~/lib/hooks/useAgentsUtils'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import useToolsStore from '~/lib/store/toolsStore'
import { GroupedTools } from '~/pages/mcpservers/components/GroupedTools'
import { type Tool } from '~/shared/ToolCard'
import { ToolPromptGenerator } from '~/shared/ToolPromptGenerator'

interface UserModelTool {
  id: number
  user_model_id: string
  user_tool_id: string
  created_at: string
  tool?: {
    id: string
    tool_name: string
    avatar?: string
    schema?: any
  }
}

interface AgentAttachToolsProps {
  userModel: {
    id: string
    name: string
  }
}

export default function AgentAttachTools({ userModel }: AgentAttachToolsProps) {
  const { api } = useAiStore()
  const { tools, loadTools, setTools, slootTools, getTools } = useToolsStore()
  const [attachedTools, setAttachedTools] = useState<UserModelTool[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpened, setModalOpened] = useState(false)
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set())
  const { savePayload } = useAgentUtils()
  const form = useFormContext()

  // Load attached tools for this agent
  const loadAttachedTools = async () => {
    //setLoading(true)
    const { data, error } = await api
      .from('user_model_tools')
      .select(
        `
        id,
        user_model_id,
        user_tool_id,
        created_at,
        tool:user_tools(*)
      `,
      )
      .eq('user_model_id', userModel.id)
      .order('created_at', { ascending: false })
    data.map((tool, index) => {
      if (!tool.tool) {
        data[index].tool = slootTools.find((t) => t.id === tool.user_tool_id)
      }
    })

    if (error) {
      console.error('Error loading attached tools:', error)
      showNotification({ title: 'Error', message: 'Failed to load attached tools', type: 'error' })
      return
    }

    setAttachedTools(data || [])
    setLoading(false)
  }

  // Attach a tool to the agent
  const handleAttachTool = async (toolId: string) => {
    const { error } = await api.from('user_model_tools').insert({
      user_model_id: userModel.id,
      user_tool_id: toolId,
    })

    if (error) {
      console.error('Error attaching tool:', error)
      showNotification({ title: 'Error', message: 'Failed to attach tool', type: 'error' })
      return
    }
    loadAttachedTools()
    await savePayload(form.getValues())
  }

  // Detach a tool from the agent
  const handleDetachTool = async (attachmentId: number) => {
    const { error } = await api.from('user_model_tools').delete().eq('id', attachmentId)

    if (error) {
      console.error('Error detaching tool:', error)
      showNotification({ title: 'Error', message: 'Failed to detach tool', type: 'error' })
      return
    }

    loadAttachedTools()
    await savePayload(form.getValues())
  }

  const openModal = () => {
    setModalOpened(true)
  }

  const closeModal = () => {
    setModalOpened(false)
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

  const init = async () => {
    setLoading(true)
    await loadTools()
    setTools([...getTools(), ...slootTools])
    loadAttachedTools()
  }

  // Load tools when modal opens
  useEffect(() => {
    init()
  }, [])

  // Get available tools (tools not already attached)
  const availableTools = tools.filter((tool) => !attachedTools.some((attached) => attached.user_tool_id === tool.id))

  // Create a default schema for tools that don't have one
  const createDefaultSchema = (toolName: string) => ({
    description: `Custom tool: ${toolName}`,
    inputSchema: {
      properties: {
        input: {
          type: 'string',
          description: 'Input for the tool',
        },
      },
      required: ['input'],
    },
  })

  return (
    <>
      <Button loading={loading} justify="space-between" fullWidth variant="light" rightSection={<RiAddLine size={24} />} onClick={openModal}>
        Attached Tools ({attachedTools.length})
      </Button>

      {/* Display attached tools summary */}
      {attachedTools.length > 0 && (
        <Group gap="xs">
          {attachedTools.map((attachment) => (
            <ToolPromptGenerator key={attachment.id} tool={attachment.tool} toolId={attachment.id} onDetach={handleDetachTool} />
          ))}
        </Group>
      )}

      <Modal opened={modalOpened} onClose={closeModal} title={`Attach Tools - ${userModel?.name}`} size="lg">
        <Stack gap="md">
          {/* Attached Tools Section */}
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={5}>Attached Tools</Title>
              <Badge variant="light" color="blue">
                {attachedTools.length} attached
              </Badge>
            </Group>

            {loading ? (
              <Text c="dimmed" size="sm">
                Loading attached tools...
              </Text>
            ) : attachedTools.length === 0 ? (
              <Text c="dimmed" size="sm">
                No tools attached to this agent.
              </Text>
            ) : (
              <Group gap="xs" wrap="wrap">
                {attachedTools.map((attachment) => (
                  <ToolPromptGenerator
                    key={attachment.id}
                    tool={{
                      id: attachment.tool?.id || attachment.id,
                      tool_name: attachment.tool?.tool_name || 'Unknown Tool',
                      avatar: attachment.tool?.avatar,
                      schema: attachment.tool?.schema || createDefaultSchema(attachment.tool?.tool_name || 'Unknown Tool'),
                    }}
                    toolId={attachment.id}
                    onDetach={handleDetachTool}
                  />
                ))}
              </Group>
            )}
          </Stack>

          {/* Available Tools Section */}
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={5}>Available Tools</Title>
              <Badge variant="light" color="green">
                {availableTools.length} available
              </Badge>
            </Group>

            {loading ? (
              <Text c="dimmed" size="sm">
                Loading available tools...
              </Text>
            ) : availableTools.length === 0 ? (
              <Text c="dimmed" size="sm">
                {attachedTools.length > 0 ? 'All available tools are already attached to this agent.' : 'No tools available to attach.'}
              </Text>
            ) : (
              <GroupedTools
                tools={availableTools as Tool[]}
                isAttached={false}
                expandedApps={expandedApps}
                onToggleAppExpansion={toggleAppExpansion}
                onAttach={(tool) => handleAttachTool(tool.id)}
                onDetach={() => {}} // Not used for available tools
              />
            )}
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
