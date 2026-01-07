import { Button, Divider, Modal, Select, Stack, Switch, Text, TextInput, Title } from '@mantine/core'
import { RiSearchLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useFormContext } from '~/lib/ContextForm'
import useAiStore from '~/lib/store/aiStore'

export default function OpenAIBuiltInTools() {
  const form = useFormContext()
  const [modalOpened, setModalOpened] = useState(false)
  const { getSelectedAgent } = useAiStore()

  // Initialize search_parameters if it doesn't exist
  useEffect(() => {
    if (!getSelectedAgent().settings.builtInTools?.web_search_preview) {
      form.setFieldValue('builtInTools', {
        web_search_preview: {
          enabled: false,
          type: 'web_search_preview',
          user_location: {
            type: 'approximate',
            country: '',
            city: '',
            region: '',
            timezone: '',
          },
          search_context_size: 'medium',
        },
      })
    }
  }, []) // Only run once on mount

  return (
    <>
      {/* Summary Button */}
      <Title order={4}>Web Search</Title>
      <Button justify="space-between" fullWidth variant="light" size="sm" rightSection={<RiSearchLine size={16} />} onClick={() => setModalOpened(true)}>
        {`Search (${form.getValues().builtInTools?.web_search_preview?.enabled ? 'on' : 'off'})`}
      </Button>

      {/* Configuration Modal */}
      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="OpenAI Web Search Configuration" size="lg">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            OpenAI models support web search through function calling. Configure search parameters to control when and how web search is performed.
          </Text>

          {/* Web Search Toggle */}
          <Stack gap="sm">
            <Switch
              key={form.key('builtInTools.web_search_preview.enabled')}
              label="Enable Web Search"
              description="Turn web search functionality on or off for this agent"
              checked={form.getValues().builtInTools?.web_search_preview?.enabled || false}
              onChange={(event) => {
                form.setFieldValue('builtInTools.web_search_preview.enabled', event.currentTarget.checked)
              }}
            />
          </Stack>

          {/* Search Configuration */}
          <Stack gap="md">
            {form.getValues().builtInTools?.web_search_preview?.enabled && (
              <>
                {/* User Location Configuration */}
                <Stack gap="sm">
                  <Text size="sm" fw={500}>
                    User Location
                  </Text>
                  <Text size="xs" c="dimmed" mb="xs">
                    Refine search results based on geography (not supported for deep research models)
                  </Text>

                  <TextInput
                    key={form.key('builtInTools.web_search_preview.user_location.country')}
                    label="Country (ISO Code)"
                    description="Two-letter ISO country code (e.g., US, GB, CH)"
                    placeholder="US"
                    {...form.getInputProps('builtInTools.web_search_preview.user_location.country')}
                  />

                  <TextInput
                    key={form.key('builtInTools.web_search_preview.user_location.city')}
                    label="City"
                    description="Free text city name (e.g., Minneapolis, London)"
                    placeholder="New York"
                    {...form.getInputProps('builtInTools.web_search_preview.user_location.city')}
                  />

                  <TextInput
                    key={form.key('builtInTools.web_search_preview.user_location.region')}
                    label="Region"
                    description="Free text region/state name (e.g., Minnesota, California)"
                    placeholder="New York"
                    {...form.getInputProps('builtInTools.web_search_preview.user_location.region')}
                  />

                  <TextInput
                    key={form.key('builtInTools.web_search_preview.user_location.timezone')}
                    label="Timezone"
                    description="IANA timezone (e.g., America/Chicago, Europe/London)"
                    placeholder="America/New_York"
                    {...form.getInputProps('builtInTools.web_search_preview.user_location.timezone')}
                  />
                </Stack>

                <Divider label="Search Context Size" labelPosition="center" />

                {/* Search Context Size */}
                <Stack gap="sm">
                  <Text size="sm" fw={500}>
                    Search Context Size
                  </Text>
                  <Text size="xs" c="dimmed" mb="xs">
                    Controls how much context is retrieved from the web (not supported for o4-mini, o3, o3-pro, and deep research models)
                  </Text>

                  <Select
                    key={form.key('builtInTools.web_search_preview.search_context_size')}
                    label="Context Size"
                    description="Higher context sizes provide richer context but slower response"
                    placeholder="Select context size"
                    data={[
                      { value: 'low', label: 'Low - Least context, fastest response, potentially lower quality' },
                      { value: 'medium', label: 'Medium - Balanced context and latency (default)' },
                      { value: 'high', label: 'High - Most comprehensive context, slower response' },
                    ]}
                    defaultValue="medium"
                    {...form.getInputProps('builtInTools.web_search_preview.search_context_size')}
                  />
                </Stack>
              </>
            )}
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
