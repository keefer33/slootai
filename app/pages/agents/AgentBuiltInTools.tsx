import { Stack } from '@mantine/core'
import useAiStore from '~/lib/store/aiStore'
import AnthropicBuiltInTools from './components/built-in-tools/AnthropicBuiltInTools'
import OpenAIBuiltInTools from './components/built-in-tools/OpenAIBuiltInTools'
import XaiBuiltInTools from './components/built-in-tools/XaiBuiltInTools'

export default function AgentBuiltInTools() {
  const { selectedModel } = useAiStore()

  if (!selectedModel) {
    return null
  }

  const renderBuiltInTools = () => {
    switch (selectedModel.brand?.toLowerCase()) {
      case 'anthropic':
        return <AnthropicBuiltInTools />
      case 'openai':
        return <OpenAIBuiltInTools />
      case 'xai':
        return <XaiBuiltInTools />
      default:
        return null
    }
  }

  return <Stack gap="md">{renderBuiltInTools()}</Stack>
}
