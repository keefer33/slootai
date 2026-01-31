import { ActionIcon, Badge, Button, CopyButton, Group, Modal, Stack, Text, Textarea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiArrowLeftLine, RiChatAiLine, RiCheckLine, RiCloseLine, RiFileCopyLine, RiMagicLine } from '@remixicon/react'
import { useState } from 'react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import useAiStore from '~/lib/store/aiStore'
import { SchemaFormGenerator } from './SchemaFormGenerator'

interface ToolPromptGeneratorProps {
  tool: {
    id: string | number
    tool_name: string
    avatar?: string
    schema?: any
  }
  toolId?: string | number
  onDetach?: (toolId: string | number) => void
}

export function ToolPromptGenerator({ tool, toolId, onDetach }: ToolPromptGeneratorProps) {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure()
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const { chatCompletions, getAuthToken } = useAiStore()
  const form = useForm({
    initialValues: {},
    validate: {},
  })

  const resetForm = () => {
    form.reset()
    setGeneratedPrompt('')
    setShowForm(true)
  }

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true)
    setGeneratedPrompt('')

    // Call the OpenAI API to generate a prompt
    const result = await chatCompletions(
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that generates prompts for MCP (Model Context Protocol) tools.

Your task is to analyze the tool information and form data, then generate a natural language prompt that describes what the user wants to accomplish.

Guidelines:
1. Understand the tool's purpose from its description and schema
2. Use the form data to understand the user's specific requirements
3. Generate a clear, detailed prompt that captures the user's intent
4. Make the prompt conversational and natural
5. Include relevant details from the form data in the prompt
6. Focus on the end result the user wants to achieve
7. Include the tool name in the prompt to make it clear which tool should be used
8. Return ONLY the prompt text - no quotes, no explanations, no additional formatting

Tool Information:
- Name: ${tool?.tool_name}
- Description: ${tool?.schema?.description || 'No description available'}
- Schema: ${JSON.stringify(tool?.schema, null, 2)}

Form Data Provided:
${JSON.stringify(form.getValues(), null, 2)}

Generate and return prompt text that includes the tool name.`,
          },
          {
            role: 'user',
            content: `Please generate a prompt for the ${tool?.tool_name} tool based on the form data I provided.`,
          },
        ],
        // temperature: 0.7,
        // max_tokens: 500,
      },
      getAuthToken(),
    )

    // Extract the generated prompt from the response
    const prompt = result.choices?.[0]?.message?.content || 'No prompt generated'
    setGeneratedPrompt(prompt)
    setShowForm(false)
    setIsGeneratingPrompt(false)
  }

  const handleBackToForm = () => {
    setShowForm(true)
    setGeneratedPrompt('')
  }

  return (
    <>
      <Badge variant="default" size="md" style={{ cursor: 'pointer' }} onClick={openModal} title="Generate prompt from form data">
        <Group gap="4">
          {tool?.avatar ? <img src={tool?.avatar} alt={tool?.tool_name} style={{ width: 14, height: 14, borderRadius: '50%' }} /> : <RiMagicLine size={14} />}
          {tool?.tool_name && tool.tool_name.length > 25 ? `${tool.tool_name.substring(0, 25)}...` : tool?.tool_name}
          {onDetach && toolId && (
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              onClick={(e) => {
                e.stopPropagation()
                onDetach(toolId)
              }}
              title="Detach tool"
              style={{ marginLeft: 4 }}
            >
              <RiCloseLine size={16} />
            </ActionIcon>
          )}
        </Group>
      </Badge>

      <Modal opened={modalOpened} onClose={closeModal} title="Generate Tool Prompt" size="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Tool: {tool?.tool_name}
            </Text>
            <Badge variant="light" color="blue">
              AI Generated
            </Badge>
          </Group>

          {showForm ? (
            <>
              <Text size="sm" c="dimmed">
                Fill out the form below to generate a natural language prompt for the {tool?.tool_name} tool.
              </Text>

              <Stack gap="md">
                <FormProvider form={form}>
                  <form>
                    <Stack gap="md">
                      <SchemaFormGenerator schema={tool?.schema} />
                    </Stack>
                  </form>
                </FormProvider>
              </Stack>

              <Group justify="space-between">
                <Button variant="light" onClick={resetForm} size="sm">
                  Reset Form
                </Button>
                <Button onClick={handleGeneratePrompt} loading={isGeneratingPrompt} disabled={isGeneratingPrompt} leftSection={<RiChatAiLine size={14} />}>
                  Generate Prompt
                </Button>
              </Group>
            </>
          ) : (
            <>
              <Text size="sm" c="dimmed">
                Here&apos;s your generated prompt for the {tool?.tool_name} tool:
              </Text>

              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Generated Prompt
                  </Text>
                  <CopyButton value={generatedPrompt} timeout={2000}>
                    {({ copied, copy }) => (
                      <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy} variant="light" size="sm">
                        {copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                </Group>
                <Textarea autosize value={generatedPrompt} readOnly minRows={8} maxRows={12} />
              </Stack>

              <Group justify="space-between">
                <Button variant="light" onClick={handleBackToForm} leftSection={<RiArrowLeftLine size={14} />}>
                  Back to Form
                </Button>
                <Button variant="light" onClick={resetForm} size="sm">
                  Start Over
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </>
  )
}
