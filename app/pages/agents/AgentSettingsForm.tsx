import { AppShell, ScrollArea, Stack } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import useAgentsUtils from '~/lib/hooks/useAgentsUtils'
import useAiStore from '~/lib/store/aiStore'
import AgentAttachFiles from '~/pages/agents/AgentAttachFiles'
import { AgentAttachMcpServers } from '~/pages/agents/AgentAttachMcpServers'
import AgentAttachTools from '~/pages/agents/AgentAttachTools'
import PipedreamMcpServerSelect from '~/pages/agents/components/PipedreamMcpServerSelect'
import FormFields from '~/shared/FormFields'
import AgentBuiltInTools from './AgentBuiltInTools'

export default function AgentSettingsForm() {
  const { selectedModel, selectedAgent } = useAiStore()
  const { savePayload, getDefaultValues } = useAgentsUtils()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      model: selectedModel?.model,
      brand: selectedModel?.brand,
      apiUrl: selectedModel?.api_url,
      config: {
        ...getDefaultValues(),
        model: selectedModel?.model,
        ...selectedAgent?.settings?.config,
      },
      pipedream: selectedAgent?.settings?.pipedream || [],
      tools: selectedAgent?.settings?.tools || [],
      files: selectedAgent?.settings?.files || [],
      builtInTools: selectedAgent?.settings?.builtInTools || {},
      optionalFields: selectedAgent?.settings?.optionalFields || [],
    },
    onValuesChange: () => {
      // Debounce the save operation
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        savePayload(form.getValues())
      }, 100)
    },
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <AppShell.Section p="0" pb="xl" grow component={ScrollArea} scrollHideDelay={0}>
        <FormProvider form={form}>
          <form>
            {/* MCP Server Management Section */}
            <Stack gap="md" p="md">
              {selectedModel.config?.capabilities?.mcp && (
                <>
                  {selectedModel.config?.capabilities?.mcp_pipedream !== false && <PipedreamMcpServerSelect />}
                  <AgentAttachMcpServers userModel={{ id: selectedAgent?.id, name: selectedAgent?.name }} />
                </>
              )}

              {/* Tool Management Section */}
              {selectedModel.config?.capabilities?.tools && <AgentAttachTools userModel={{ id: selectedAgent?.id, name: selectedAgent?.name }} />}
              <AgentBuiltInTools />

              {(selectedModel.config?.capabilities?.files.images || selectedModel.config?.capabilities?.files.files) && (
                <AgentAttachFiles userModel={{ id: selectedAgent?.id, name: selectedAgent?.name }} />
              )}

              {selectedModel?.forms && <FormFields formFields={selectedModel?.forms} path="config." optionalListField="optionalFields" />}
            </Stack>
          </form>
        </FormProvider>
      </AppShell.Section>
    </>
  )
}
