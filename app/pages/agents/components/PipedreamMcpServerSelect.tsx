import { ActionIcon, Avatar, Badge, Box, Button, Card, Container, Group, Modal, SimpleGrid, Stack, Tabs, Text, useMantineColorScheme } from '@mantine/core'
import { RiAddLine, RiCloseLine, RiToolsLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useFormContext } from '~/lib/ContextForm'
import useAgentUtils from '~/lib/hooks/useAgentsUtils'
import useAiStore from '~/lib/store/aiStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import PipedreamAppList from '~/pages/pipedream/components/PipedreamAppList'

export default function PipedreamMcpServerSelect() {
  const form: any = useFormContext()
  const { getSelectedAgent, setSelectedAgent } = useAiStore()
  const { memberApps } = usePipedreamStore()
  const { savePayload } = useAgentUtils()
  const [opened, setOpened] = useState(false)
  const { colorScheme } = useMantineColorScheme()
  const [selectedTools, setSelectedTools] = useState([])
  const [availableTools, setAvailableTools] = useState([])
  const [loading, setLoading] = useState(false)

  const addTool = (tool: any) => {
    const appConfig = {
      id: tool.id,
      name: tool.app.nameSlug,
      label: tool.app.name,
      avatar: tool.app.imgSrc,
    }
    setSelectedAgent({
      ...getSelectedAgent(),
      settings: {
        ...getSelectedAgent().settings,
        pipedream: [...(getSelectedAgent()?.settings?.pipedream || []), appConfig],
      },
    })
    savePayload(form.getValues())
    init()
  }

  const removeTool = (toolId: string) => {
    setSelectedAgent({
      ...getSelectedAgent(),
      settings: {
        ...getSelectedAgent().settings,
        pipedream: getSelectedAgent()?.settings?.pipedream.filter((tool: any) => tool.id !== toolId),
      },
    })
    savePayload(form.getValues())
    init()
  }

  const init = async () => {
    setSelectedTools(getSelectedAgent()?.settings?.pipedream)
    const getAvailableTools = memberApps?.data?.filter((tool) => !getSelectedAgent()?.settings?.pipedream?.some((selected: any) => selected.name === tool.app.nameSlug)) || []
    setAvailableTools(getAvailableTools)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    init()
  }, []) // Only run once on mount

  return (
    <>
      <Button loading={loading} justify="space-between" variant="light" onClick={() => setOpened(true)} rightSection={<RiAddLine size={24} />} fullWidth>
        Pipedream MCP ({selectedTools?.length || 0})
      </Button>

      {selectedTools?.length > 0 && (
        <Group gap="xs">
          {selectedTools.map((tool) => (
            <Badge
              key={uuidv4()}
              size="md"
              variant="default"
              leftSection={<Avatar src={tool.avatar} size={18} radius="xl" />}
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTool(tool.id)
                  }}
                  title="Remove tool"
                  style={{ marginLeft: 4 }}
                >
                  <RiCloseLine size={16} />
                </ActionIcon>
              }
              style={{ cursor: 'pointer' }}
              onClick={() => removeTool(tool.id)}
            >
              {tool.name}
            </Badge>
          ))}
        </Group>
      )}

      <Modal opened={opened} onClose={() => setOpened(false)} title="Pipedream MCP Servers" fullScreen p="0">
        <Container p="0">
          <Tabs defaultValue="tools" variant="pills">
            <Tabs.List>
              <Tabs.Tab value="tools" size="sm">
                Servers ({selectedTools?.length || 0} selected, {availableTools?.length || 0} available)
              </Tabs.Tab>
              <Tabs.Tab value="search" size="sm">
                Search & Add
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="tools" pt="md">
              <Stack gap="lg">
                {/* Selected Tools */}
                {selectedTools?.length > 0 && (
                  <Box>
                    <Text size="sm" fw={500} mb="xs">
                      Selected Servers ({selectedTools?.length || 0})
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs">
                      {selectedTools.map((tool: any) => (
                        <Card
                          key={uuidv4()}
                          p="xs"
                          withBorder={false}
                          style={{ cursor: 'pointer' }}
                          onClick={() => removeTool(tool.id)}
                          bg={colorScheme === 'dark' ? 'dark.5' : 'gray.1'}
                        >
                          <Group gap="sm">
                            {tool?.avatar ? (
                              <Avatar src={tool.avatar} size={28} radius="xl" />
                            ) : (
                              <Avatar color="cyan" radius="xl" size={28}>
                                <RiToolsLine size={16} />
                              </Avatar>
                            )}
                            <Text size="sm" style={{ flex: 1 }}>
                              {tool?.label}
                            </Text>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeTool(tool.id)
                              }}
                              title="Remove tool"
                            >
                              <RiCloseLine size={20} />
                            </ActionIcon>
                          </Group>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Available Tools */}
                {availableTools?.length > 0 && (
                  <Box>
                    <Text size="sm" fw={500} mb="xs">
                      Available Servers ({availableTools?.length || 0})
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs">
                      {availableTools.map((tool) => (
                        <Card
                          key={uuidv4()}
                          p="xs"
                          withBorder={false}
                          style={{ cursor: 'pointer' }}
                          onClick={() => addTool(tool)}
                          bg={colorScheme === 'dark' ? 'dark.5' : 'gray.1'}
                        >
                          <Group gap="sm">
                            {tool.app.imgSrc ? (
                              <Avatar src={tool.app.imgSrc} size={28} radius="xl" />
                            ) : (
                              <Avatar color="cyan" radius="xl" size={28}>
                                <RiToolsLine size={16} />
                              </Avatar>
                            )}
                            <Text size="sm" style={{ flex: 1 }}>
                              {tool.app.name}
                            </Text>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="green"
                              onClick={(e) => {
                                e.stopPropagation()
                                addTool(tool)
                              }}
                              title="Add tool"
                            >
                              <RiAddLine size={20} />
                            </ActionIcon>
                          </Group>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {selectedTools?.length === 0 && availableTools?.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No tools available
                  </Text>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="search" pt="md">
              <Stack gap="md">
                <PipedreamAppList />
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Container>
      </Modal>
    </>
  )
}
