import { ActionIcon, AppShell, Box, Burger, Center, Group, NavLink, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiArrowLeftSLine, RiQuestionAnswerLine, RiSoundModuleLine } from '@remixicon/react'
import { useEffect } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'
import useAgentsUtils from '~/lib/hooks/useAgentsUtils'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import useMcpServersStore from '~/lib/store/mcpServersStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import useThreadsStore from '~/lib/store/threadsStore'
import { getClient, getMcpServers } from '~/lib/supaServerClient'
import AgentChatHeader from '~/pages/agents/AgentChatHeader'
import AgentChatMessages from '~/pages/agents/AgentChatMessages'
import AgentSettingsForm from '~/pages/agents/AgentSettingsForm'
import AgentThreads from '~/pages/agents/AgentThreads'
import Mounted from '~/shared/Mounted'
import { UserMenu } from '~/shared/UserMenu'
import AgentPrompt from './AgentPrompt'

export const revalidate = 1

export async function loader({ request, params }) {
  const { agentid } = params
  const { supabase } = await getClient(request)
  const { data: getUserModels, error: modelsError } = await supabase.from('user_models').select('*, model:models(*, brand:brands(slug))').order('created_at', { ascending: false })

  // Transform the data to populate brand field with slug
  const transformedUserModels = (getUserModels || []).map((model) => ({
    ...model,
    brand: model.model?.brand?.slug || null,
  }))

  const getAgent = transformedUserModels.find((model) => model.id === agentid)
  const { data: getThreads, error: getThreadsError } = await supabase.from('threads').select('*').eq('model_id', getAgent.id).order('created_at', { ascending: false })
  const threadMessagesPromises = getThreads.map(async (thread) => {
    const { data: messages, error: messageError } = await supabase.from('thread_messages').select('*').eq('thread_id', thread.id).order('created_at', { ascending: false })
    if (!messageError) {
      return {
        ...thread,
        thread_messages: messages || [], // Attach messages to the thread
      }
    }
  })
  const threadsWithMessages = await Promise.all(threadMessagesPromises)

  const { servers, error: serversError }: any = await getMcpServers(request)

  return {
    getAgent,
    getThreads,
    threadsWithMessages,
    errors: { modelsError, getThreadsError, serversError },
    getUserModels: transformedUserModels,
    servers: servers,
  }
}

export default function Agent() {
  const { getAgent, threadsWithMessages, errors, getUserModels, servers } = useLoaderData<typeof loader>()
  const { colorScheme } = useMantineColorScheme()
  const { setSelectedModel, setSelectedAgent, getModels, pageLoading, setPageLoading, setUserModels, selectedAgent, selectedModel } = useAiStore()
  const { setThreads, setShowHistory } = useThreadsStore()
  const { setMcpServers } = useMcpServersStore()
  const { resetAgent } = useAgentsUtils()
  const { getAccountList } = usePipedreamStore()

  const navigate = useNavigate()
  const { user, getAuthToken } = useAiStore()
  const loadAgent = async () => {
    setPageLoading(true)
    await getAccountList(user.id, getAuthToken())
    setMcpServers(servers)
    const model = getModels().find((model) => model.id === getAgent.model_id)
    if (threadsWithMessages[0]) {
      setThreads(threadsWithMessages)
    } else {
      // If no threads exist, show history (empty state)
      setShowHistory(true)
    }
    setSelectedModel(model)
    setSelectedAgent(getAgent)
    setPageLoading(false)
  }

  const oopsGotError = () => {
    if (errors.modelsError) {
      showNotification({ title: 'Error', message: errors.modelsError?.message, type: 'error' })
    } else if (errors.getThreadsError) {
      showNotification({ title: 'Error', message: errors.getThreadsError?.message, type: 'error' })
    }
    setPageLoading(false)
    navigate('/agents')
  }

  useEffect(() => {
    resetAgent()
    if (errors.modelsError || errors.getThreadsError) {
      oopsGotError()
    } else {
      loadAgent()
      setUserModels(getUserModels)
    }
  }, [])

  const [asideMobileOpened, { toggle: toggleAsideMobile }] = useDisclosure()
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()

  return (
    <AppShell
      layout="alt"
      header={{ height: 80 }}
      footer={{ height: 120 }}
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
      padding="0"
      withBorder={false}
    >
      <AppShell.Header p="lg" bg="transparent">
        <Group justify="space-between">
          <ActionIcon variant="light" size="md" onClick={toggleMobile}>
            <RiQuestionAnswerLine size={24} />
          </ActionIcon>
          <AgentChatHeader />
          <ActionIcon variant="light" size="md" onClick={toggleAsideMobile}>
            <RiSoundModuleLine size={24} />
          </ActionIcon>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="0" bg={colorScheme === 'dark' ? 'dark.5' : 'gray.2'}>
        <Group justify="space-between">
          <Box>
            <NavLink label="Back To Agents" component={Link} to="/account/agents" leftSection={<RiArrowLeftSLine />} />
          </Box>
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
        </Group>
        <AgentThreads />

        <AppShell.Section p="xs">
          <Center>
            <Group gap="xs">
              <UserMenu />
            </Group>
          </Center>
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main pb="0" bg={colorScheme === 'dark' ? 'dark.8' : 'gray.0'}>
        <Mounted pageLoading={pageLoading} size="sm">
          <AgentChatMessages />
        </Mounted>
      </AppShell.Main>
      <AppShell.Aside px="0" bg={colorScheme === 'dark' ? 'dark.5' : 'gray.2'}>
        <Group justify="space-between" pb="xs">
          <Burger opened={asideMobileOpened} onClick={toggleAsideMobile} size="sm" hiddenFrom="md" />
        </Group>
        {selectedModel?.id && selectedAgent?.id && <AgentSettingsForm />}
      </AppShell.Aside>
      <AppShell.Footer bg="transparent">
        <Mounted pageLoading={pageLoading} size="sm">
          <AgentPrompt />
        </Mounted>
      </AppShell.Footer>
    </AppShell>
  )
}
