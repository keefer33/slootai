import { Badge, Box, Image, useMantineColorScheme } from '@mantine/core'
import { useEffect } from 'react'
import { useChatScroll } from '~/lib/hooks/useChatScroll'
import { formatDate } from '~/lib/utils'
import MarkdownRenderer from './MarkdownRenderer'

export default function ProcessContent({ message }: any) {
  const { colorScheme } = useMantineColorScheme()
  const { scrollToBottom } = useChatScroll()

  useEffect(() => {
    scrollToBottom('instant', 0)
  }, [scrollToBottom])

  return (
    <>
      {(message.content || message.parts?.[0]?.text) && (
        <Box>
          {message.role === 'user' && (
            <Box pos="relative">
              <Box pos="absolute" top="-15px" left="0px">
                <Badge size="sm" radius="0">
                  User
                </Badge>
                {message.created_at && (
                  <Badge size="sm" radius="0" bg="gray.4" c="gray.7">
                    {formatDate(message.created_at)}
                  </Badge>
                )}
              </Box>
              <Box p="sm" bg={colorScheme === 'dark' ? 'dark.5' : 'gray.0'} style={{ wordBreak: 'break-word' }}>
                {message.content || message.parts?.[0]?.text}
              </Box>
            </Box>
          )}

          {(message.role === 'assistant' || message.role === 'model') && (
            <>
              <Box ml={{ base: 0, sm: 'xs' }}>
                {message.type === 'image' && (
                  <Box>
                    <Image
                      radius="sm"
                      w="100%"
                      fit="contain"
                      src={message.output}
                      onLoad={() => {
                        // Scroll after a short delay to ensure the image is fully rendered
                        scrollToBottom('smooth', 50)
                      }}
                    />
                    <Box>{message.prompt}</Box>
                  </Box>
                )}
                <MarkdownRenderer content={message.content || message.parts?.[0]?.text} />
              </Box>
            </>
          )}
        </Box>
      )}
    </>
  )
}
