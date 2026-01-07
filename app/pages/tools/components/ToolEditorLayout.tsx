import { ActionIcon, AppShell, Box, Burger, Button, Center, Group, Paper, ScrollArea, Stack, Text, Textarea, useMantineColorScheme } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { RiMagicLine, RiPencilLine, RiSendPlaneLine, RiSoundModuleLine, RiToolsLine } from '@remixicon/react'
import { useEffect } from 'react'
import { Outlet, useNavigate, useParams, useRevalidator } from 'react-router'
import { useChatScroll } from '~/lib/hooks/useChatScroll'
import useAiStore from '~/lib/store/aiStore'
import useToolsStore, { type Tool } from '~/lib/store/toolsStore'
import ProcessContent from '~/shared/ProcessContent'
import { UserMenu } from '~/shared/UserMenu'
import { SchemaFormTools } from '../components/SchemaFormTools'
import ToolModal from './ToolModal'
import { ToolNavbar } from './ToolNavbar'

export default function ToolEditorLayout() {
  const params = useParams()
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const { toolId } = params
  const { colorScheme } = useMantineColorScheme()
  const [asideMobileOpened, { toggle: toggleAsideMobile }] = useDisclosure()
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()
  const [navbarEditModalOpened, { open: openNavbarEditModal, close: closeNavbarEditModal }] = useDisclosure()
  const { user, isAdmin, getAuthToken } = useAiStore()

  // Form for AI chat input
  const form = useForm({
    initialValues: {
      message: '',
    },
  })

  const {
    selectedTool,
    isSlootTool,
    // Tool Editor state
    editingTool,
    saving,
    // Tool Editor actions
    setEditingTool,
    setCurrentMessage,
    setInitialPrompt,
    setSchemaChanges,
    setShowAiChat,
    // Tool Editor operations
    handleAiChat,
    handleSaveSchema,
    // Getters
    getShowAiChat,
    getAiLoading,
    messages,
    getInitialPrompt,
    getShowSchemaDiff,
    getSchemaChanges,
  } = useToolsStore()
  const { viewport, scrollToBottom } = useChatScroll()

  // Force revalidation when toolId changes to ensure fresh data
  useEffect(() => {
    if (toolId) {
      revalidator.revalidate()
    }
  }, [toolId])

  const handleAiChatWrapper = async (action: 'initialize' | 'continue', prompt?: string) => {
    if (!user?.id) return

    // Scroll to bottom when AI starts loading
    setTimeout(() => scrollToBottom(), 100)

    await handleAiChat(action, prompt, user.id, getAuthToken())

    // Scroll to bottom after new messages are added
    setTimeout(() => scrollToBottom(), 100)
  }

  const handleSaveSchemaClick = async () => {
    if (!user?.id) return
    await handleSaveSchema(user.id)
  }

  return (
    <AppShell
      layout="alt"
      header={{ height: 50 }}
      navbar={{
        width: 280,
        breakpoint: 'md',
        collapsed: { mobile: !mobileOpened, desktop: mobileOpened },
      }}
      aside={{
        width: 280,
        breakpoint: 'md',
        collapsed: { mobile: !asideMobileOpened, desktop: asideMobileOpened },
      }}
      padding="sm"
      withBorder={false}
    >
      <AppShell.Header>
        <Group justify="space-between">
          <ActionIcon variant="light" size="md" onClick={toggleMobile}>
            <RiToolsLine size={24} />
          </ActionIcon>
          <ActionIcon variant="light" size="md" onClick={toggleAsideMobile}>
            <RiSoundModuleLine size={24} />
          </ActionIcon>
        </Group>
        <Group justify="space-between" px="sm">
          <Group gap="xs">
            <Text fw={600} size="xl">
              {selectedTool?.tool_name}
            </Text>
            {isSlootTool && (
              <Text size="sm" c="green" fw={500}>
                (Read-only)
              </Text>
            )}
            {!isSlootTool && (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => {
                  setEditingTool(selectedTool as unknown as Tool)
                  openNavbarEditModal()
                }}
                title="Edit tool settings"
              >
                <RiPencilLine size={16} />
              </ActionIcon>
            )}
          </Group>
          <Group gap="xs">
            {/* Save Button */}
            {!isSlootTool && !getShowSchemaDiff() && getSchemaChanges() && (
              <Box>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Unsaved changes
                  </Text>
                  <Group gap="xs">
                    <Button variant="light" size="xs" onClick={() => setSchemaChanges('')}>
                      Discard
                    </Button>
                    <Button size="xs" loading={saving} onClick={handleSaveSchemaClick}>
                      Save Schema
                    </Button>
                  </Group>
                </Group>
              </Box>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      {/* Navbar - Tools List */}
      <AppShell.Navbar p="0" bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'}>
        <Group align="end" justify="end">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
        </Group>
        <AppShell.Section p="xs">
          <Button
            variant="light"
            size="sm"
            onClick={() => {
              toggleMobile()
              toggleAsideMobile()
              navigate('/account/tools')
            }}
            mb="md"
          >
            ← Back to Tools
          </Button>
          <Group justify="space-between" mb="md">
            <Text fw={600} size="lg">
              Tools
            </Text>
          </Group>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea}>
          <ToolNavbar />
        </AppShell.Section>
        <AppShell.Section>
          <Center p="xs">
            <Group gap="xs">
              <UserMenu />
            </Group>
          </Center>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Main Area - Dynamic Content */}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      {/* Aside - AI Schema Generator */}
      <AppShell.Aside bg={colorScheme === 'dark' ? 'dark.5' : 'gray.0'}>
        <Group align="end" justify="end">
          <Burger opened={asideMobileOpened} onClick={toggleAsideMobile} size="sm" hiddenFrom="md" />
        </Group>
        {!selectedTool ? (
          <Text>Tool not found</Text>
        ) : (
          <Stack gap="xs" h="100%">
            {/* Top Section - Header and Controls */}
            <Box p="md">
              <Group justify="space-between">
                <Text fw={600} size="lg">
                  {getShowAiChat() ? 'AI Schema Generator' : 'Run Tool'}
                </Text>
                {!isSlootTool && (
                  <Button size="xs" variant="light" leftSection={<RiMagicLine size={14} />} onClick={() => setShowAiChat(!getShowAiChat())}>
                    {getShowAiChat() ? 'Show Form' : 'AI Generator'}
                  </Button>
                )}
              </Group>
            </Box>

            {/* Middle Section - Scrollable Content */}
            <Box style={{ flex: 1, minHeight: 0 }}>
              {getShowAiChat() ? (
                // AI Chat Content
                <ScrollArea h="100%" viewportRef={viewport}>
                  <Stack gap="md">
                    {/* Initial Prompt Section */}
                    {messages.length === 0 && (
                      <Paper p="md" withBorder>
                        <Stack gap="md">
                          <Text size="sm">Enter a website URL, API documentation, or describe what you want to create:</Text>
                          <Textarea
                            placeholder="e.g., https://docs.example.com/api or 'Create a tool for image generation with parameters for width, height, and style'"
                            value={getInitialPrompt()}
                            onChange={(e) => setInitialPrompt(e.target.value)}
                            minRows={3}
                            resize="vertical"
                            autosize
                          />
                          <Button onClick={() => handleAiChatWrapper('initialize', getInitialPrompt())} loading={getAiLoading()} disabled={!getInitialPrompt().trim()}>
                            Start AI Assistant
                          </Button>
                        </Stack>
                      </Paper>
                    )}

                    {/* Chat Messages */}
                    {messages.length > 0 && (
                      <Stack gap="md" pb="md">
                        {messages.map((msg, index) => (
                          <Paper key={index} p="xs" style={{ whiteSpace: 'pre-wrap' }}>
                            <Text size="xs" fw={500} c="dimmed" mb={8}>
                              {msg.role === 'user' ? 'You' : 'AI Assistant'}
                            </Text>
                            <ProcessContent message={{ role: msg.role, content: msg.content }} />
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </ScrollArea>
              ) : (
                // Form Content
                <Box>{selectedTool && <SchemaFormTools key={selectedTool.id} schema={selectedTool.schema} toolId={selectedTool.id} />}</Box>
              )}
            </Box>

            {/* Bottom Section - Actions and Input */}
            <Box>
              {getShowAiChat() ? (
                // AI Chat Input Section
                messages.length > 0 && (
                  <Stack gap="xs" p="xs">
                    <Textarea placeholder="Ask the AI to help with your schema..." {...form.getInputProps('message')} style={{ flex: 1 }} rows={3} />
                    <Button
                      size="xs"
                      leftSection={<RiSendPlaneLine size={14} />}
                      variant="light"
                      onClick={() => {
                        // Update store with current form value before sending
                        setCurrentMessage(form.values.message)
                        handleAiChatWrapper('continue')
                      }}
                      loading={getAiLoading()}
                      disabled={!form.values.message.trim()}
                    >
                      Send
                    </Button>
                  </Stack>
                )
              ) : (
                // Form Actions Section
                <Stack gap="xs"></Stack>
              )}
            </Box>
          </Stack>
        )}
      </AppShell.Aside>

      <ToolModal
        isAdmin={isAdmin}
        mode="edit"
        tool={editingTool as any}
        onToolUpdated={(updatedTool) => {
          setEditingTool(updatedTool)
          // Note: setSelectedTool will be handled by the child component
          closeNavbarEditModal()
        }}
        opened={navbarEditModalOpened}
        onCloseModal={closeNavbarEditModal}
      />
    </AppShell>
  )
}
