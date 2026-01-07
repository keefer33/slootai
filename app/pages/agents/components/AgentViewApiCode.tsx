import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { ActionIcon, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { RiCodeLine } from '@remixicon/react'
import CodeMirror from '@uiw/react-codemirror'
import { useState } from 'react'
import { useFormContext } from '~/lib/ContextForm'
import useAgentsUtils from '~/lib/hooks/useAgentsUtils'
import useAiStore from '~/lib/store/aiStore'

export default function AgentViewApiCode() {
  const { selectedModel, authToken } = useAiStore()
  const { createPayload } = useAgentsUtils()
  const form = useFormContext()
  const [codeModalOpened, setCodeModalOpened] = useState(false)
  const [fetchCode, setFetchCode] = useState('')

  const handleCodeClick = async () => {
    try {
      // Create payload using the agent's configuration
      const agentPayload = await createPayload(form.getValues(), true)

      // Generate fetch code example with payload as JavaScript object
      const fetchExample = `// Agent payload configuration
const apiUrl = 'https://api.sloot.ai${selectedModel?.api_url}'
const authToken = '${authToken}'
const payload = ${JSON.stringify(agentPayload, null, 2)}

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

      setFetchCode(fetchExample)
      setCodeModalOpened(true)
    } catch (error) {
      console.error('Error creating payload:', error)
    }
  }

  return (
    <>
      {/* Compact Action Buttons */}

      <ActionIcon size="md" variant="transparent" onClick={() => handleCodeClick()}>
        <RiCodeLine size={24} />
      </ActionIcon>

      {/* Code Modal */}
      <Modal opened={codeModalOpened} onClose={() => setCodeModalOpened(false)} title="Agent Payload & API Code" size="xl">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            View the agent&apos;s payload configuration and example API usage code.
          </Text>

          <div>
            <Text size="sm" fw={500} mb="xs">
              Complete Example Code:
            </Text>
            <CodeMirror
              value={fetchCode}
              extensions={[javascript()]}
              theme={oneDark}
              readOnly
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                foldGutter: true,
                syntaxHighlighting: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                history: true,
              }}
            />
          </div>

          <Group justify="flex-end" gap="xs">
            <Button variant="light" onClick={() => setCodeModalOpened(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(fetchCode)
              }}
            >
              Copy Code
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
