import { Box } from '@mantine/core'
import MarkdownRenderer from '~/shared/MarkdownRenderer'

export default function ChatMessageAgentText({ message }: any) {
  return (
    <Box ml={{ base: 0, sm: 'xs' }}>
      <MarkdownRenderer content={message} />
    </Box>
  )
}
