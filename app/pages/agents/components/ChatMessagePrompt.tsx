import { Badge, Box, useMantineColorScheme } from '@mantine/core'
import { formatDate } from '~/lib/utils'

export default function ChatMessagePrompt({ message }: any) {
  const { colorScheme } = useMantineColorScheme()
  return (
    <Box pos="relative" p="xs" bg={colorScheme === 'dark' ? 'dark.5' : 'gray.0'}>
      <Box pos="absolute" top="-15px" left="0px">
        <Badge size="sm" radius="0">
          User
        </Badge>
        {message.created_at && (
          <Badge size="sm" radius="0" bg="gray.4" c="gray.7">
            {formatDate(message?.created_at)}
          </Badge>
        )}
      </Box>
      <Box style={{ wordBreak: 'break-word' }}>{message.text}</Box>
    </Box>
  )
}
