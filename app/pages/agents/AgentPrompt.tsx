import { ActionIcon, Badge, Group, Modal, Stack, Text, Textarea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiChatUploadLine, RiFullscreenLine } from '@remixicon/react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import useAgentPrompt from '~/lib/hooks/useAgentPrompt'
import useAgentsUtils from '~/lib/hooks/useAgentsUtils'
import useAgentThreads from '~/lib/hooks/useAgentThreads'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import useThreadsStore from '~/lib/store/threadsStore'
import PaymentModal from '../account/components/PaymentModal'
import AgentEdit from './components/AgentEdit'
import AgentViewApiCode from './components/AgentViewApiCode'
import { ChatMessageSummary } from './components/ChatMessageSummary'

export default function AgentPrompt() {
  const { selectedAgent, selectedModel, setLoading, loading, getUserBalance } = useAiStore()
  const { handleThreads, showHistory, setShowHistory, setLiveStreamContent, setLiveStreamUpdates } = useThreadsStore()
  const { createPayload, resetPayload } = useAgentsUtils()
  const [fullscreenOpened, { open: openFullscreen, close: closeFullscreen }] = useDisclosure(false)
  const { processResponse, processStream } = useAgentPrompt()
  const { createCumulativeMessage } = useAgentThreads()
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false)
  const form = useForm({
    initialValues: { prompt: '' },
  })

  const onHandleSubmit = async () => {
    //check if the user has enough balance
    //if users has selectedAgent.apikey is not null and the balance is less than 0, then show a message to add funds to your account to use this agent
    const balance = await getUserBalance()
    if (balance !== null && !selectedAgent.apikey && balance <= 0) {
      showNotification({
        title: 'Insufficient Balance',
        message: 'Please add funds to your account to use this agent',
        type: 'warning',
      })
      openPaymentModal()
      return
    }
    //set a timer to figure out how long a submit takes
    const prompt = form.getValues()?.prompt
    setShowHistory(false)
    setLiveStreamContent('')
    setLiveStreamUpdates(null)
    closeFullscreen()
    if (!prompt) {
      showNotification({ title: 'Error', message: 'Please enter a prompt', type: 'error' })
      return
    }

    setLoading(true)
    const payload = createPayload(form.getValues())

    //let assistantContent = ''
    const startTime = Date.now()
    let responseData = null
    if (selectedAgent.settings?.config?.stream === true) {
      responseData = await processStream(payload)
      //assistantContent = streamResult.assistantContent
    } else {
      responseData = await processResponse(payload)
      //assistantContent = response.assistantContent
    }
    if (responseData.success) {
      if (responseData?.data?.thread_id) {
        await handleThreads(responseData?.data?.thread_id, selectedAgent.id)
        form.reset()
      }
      setLoading(false)
      //setLiveStreamUpdates(null)
      const endTime = Date.now()
      const duration = endTime - startTime
      const durationInSeconds = duration / 1000
      console.log('duration', durationInSeconds)
    } else {
      showNotification({ title: responseData?.error, message: responseData?.message, type: 'error' })
      resetPayload()
    }
  }

  return (
    <FormProvider form={form}>
      <form onSubmit={form.onSubmit(onHandleSubmit)}>
        <Stack gap="xs">
          <Group justify="space-between">
            <Group gap="xs">
              <Text maw="180px" truncate="end">
                {selectedAgent?.name}
              </Text>
              <AgentEdit model={selectedAgent} updateSelectedAgent={true} />
            </Group>
            <Group gap="xs">
              <Badge visibleFrom="sm">{selectedModel?.model}</Badge>
              {showHistory && createCumulativeMessage() && <ChatMessageSummary message={createCumulativeMessage()!} buttonVariant="transparent" icon="history" />}
              <AgentViewApiCode />
              <ActionIcon size="md" variant="transparent" onClick={openFullscreen}>
                <RiFullscreenLine size={24} />
              </ActionIcon>
            </Group>
          </Group>
          <Textarea
            size="md"
            placeholder="How Can I Help You?"
            key={form.key('prompt')}
            {...form.getInputProps('prompt')}
            data-autofocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onHandleSubmit()
              }
            }}
            rightSectionWidth={60}
            rightSection={
              <ActionIcon variant="transparent" size="lg" onClick={onHandleSubmit} loading={loading}>
                <RiChatUploadLine size={36} />
              </ActionIcon>
            }
            disabled={loading}
          />
        </Stack>
      </form>

      <Modal
        opened={fullscreenOpened}
        onClose={closeFullscreen}
        title="Write Your Prompt"
        size="xl"
        styles={{
          title: { fontSize: '1.2rem', fontWeight: 600 },
        }}
      >
        <Stack gap="md">
          <Textarea
            placeholder="How Can I Help You?"
            key={form.key('prompt')}
            {...form.getInputProps('prompt')}
            autosize
            minRows={20}
            maxRows={30}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onHandleSubmit()
              }
            }}
            disabled={loading}
            autoFocus
            styles={{
              input: {
                resize: 'vertical',
              },
            }}
          />
          <Group justify="flex-end">
            <ActionIcon variant="filled" size="lg" onClick={onHandleSubmit} loading={loading}>
              <RiChatUploadLine size={24} />
            </ActionIcon>
          </Group>
        </Stack>
      </Modal>
      {/* Payment Modal */}
      <PaymentModal opened={paymentModalOpened} onClose={closePaymentModal} />
    </FormProvider>
  )
}
