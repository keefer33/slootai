import { ScrollArea, Stack } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { useChatScroll } from '~/lib/hooks/useChatScroll'
import useAiStore from '~/lib/store/aiStore'
import useThreadsStore from '~/lib/store/threadsStore'
import ChatMessageAgentText from './components/ChatMessageAgentText'
import ChatMessageHistory from './components/ChatMessageHistory'
import { LiveStreamUpdates } from './components/LiveStreamUpdates'

function LiveStreamBox() {
  const { getLiveStreamContent } = useThreadsStore()
  return getLiveStreamContent() ? (
    <>
      <ChatMessageAgentText message={getLiveStreamContent()} />
    </>
  ) : null
}

export default function AgentChatMessages() {
  const { loading } = useAiStore()
  const { threadMessages } = useThreadsStore()
  const { viewport, scrollToBottom, scrollToTop } = useChatScroll()
  const prevThreadMessagesLength = useRef(threadMessages.length)

  useEffect(() => {
    // If a new user message was added (odd number of messages), scroll to top
    if (threadMessages.length > prevThreadMessagesLength.current) {
      const newMessage = threadMessages[threadMessages.length - 1]
      if (newMessage.role === 'user') {
        scrollToTop('smooth', 50)
        //scrollToBottom('instant', 0)
      } else {
        // For assistant messages, scroll to bottom
        scrollToBottom('instant', 0)
      }
    } else {
      // For other updates (like streaming), scroll to bottom
      scrollToBottom('instant', 0)
    }

    prevThreadMessagesLength.current = threadMessages.length
  }, [scrollToBottom, scrollToTop, threadMessages, loading])

  return (
    <ScrollArea h={`calc(100vh - 230px)`} viewportRef={viewport} offsetScrollbars>
      <Stack gap="sm" py="xs">
        <ChatMessageHistory />
        <LiveStreamBox />
        <LiveStreamUpdates />
      </Stack>
    </ScrollArea>
  )
}
