import { Group } from '@mantine/core'
import useAgentThreads from '~/lib/hooks/useAgentThreads'
import useThreadsStore from '~/lib/store/threadsStore'
import CopyButton from '~/shared/CopyButton'
import ChatMessageAgentText from './ChatMessageAgentText'
import ChatMessagePrompt from './ChatMessagePrompt'
import { ChatMessageSummary } from './ChatMessageSummary'

function UserMessage() {
  const { getUserMessage } = useThreadsStore()

  const payload = {
    text: getUserMessage()?.content?.[0]?.text,
    created_at: getUserMessage()?.created_at,
  }
  return getUserMessage() ? <ChatMessagePrompt message={payload} /> : null
}

export default function ChatMessageHistory() {
  const { showHistory } = useThreadsStore()
  const { getMessagesByBrand } = useAgentThreads()

  const parsedMessages = () => {
    const messages = getMessagesByBrand()
    return messages.map((message, messageIndex) => {
      return (
        <div key={messageIndex}>
          {/* Display text messages first */}
          <ChatMessagePrompt message={message.user} />
          <ChatMessageAgentText message={message.assistant.content} fullMessage={message} />
          <Group gap="xs" mt="xs" mb="md" justify="flex-start">
            <ChatMessageSummary message={message} buttonVariant="default" icon="summary" />
            <CopyButton text={message.assistant.content} />
          </Group>
        </div>
      )
    })
  }

  return (
    <>
      {showHistory && parsedMessages()}
      <UserMessage />
    </>
  )
}
