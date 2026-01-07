import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { ActionIcon, Box, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiCodeLine } from '@remixicon/react'
import CodeMirror from '@uiw/react-codemirror'
import type { UserModel } from '../types'

interface AgentCodeExampleProps {
  model: UserModel
}

export default function AgentCodeExample({ model }: AgentCodeExampleProps) {
  const [opened, { open, close }] = useDisclosure(false)

  const getCodeSample = () => {
    return `// Agent payload configuration
    const apiUrl = 'https://api.sloot.ai/agents'
    const authToken = '*********************************'
    const payload = {
      "prompt": "Hello, how are you?",
      "files": [],
      "thread_id": "",
      "agent_id": "${model.id}"
    }
    
    // Example fetch call to use this agent
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${authToken}\`  
      },
      body: JSON.stringify(payload)
    })
    
    // For streaming response
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          console.log(data)
        }
      }
    }
    
    // For non-streaming response
    const result = await response.json()
    console.log(result)`
  }

  const getModalTitle = () => {
    return `Code Example - ${model.name}`
  }

  const getTooltipLabel = () => {
    return 'Show code example'
  }

  return (
    <>
      <ActionIcon
        variant="subtle"
        color="blue"
        onClick={(e) => {
          e.stopPropagation()
          open()
        }}
        title={getTooltipLabel()}
      >
        <RiCodeLine size={16} />
      </ActionIcon>

      <Modal opened={opened} onClose={close} title={getModalTitle()} size="xl">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Use this code example to integrate with your agent via API. Replace the API key and adjust the request payload as needed.
          </Text>

          <Box
            style={{
              border: '1px solid var(--mantine-color-gray-3)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <CodeMirror
              value={getCodeSample()}
              height="400px"
              extensions={[javascript()]}
              theme={oneDark}
              editable={false}
              style={{
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            />
          </Box>

          <Group justify="flex-end">
            <Button variant="light" onClick={close}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
