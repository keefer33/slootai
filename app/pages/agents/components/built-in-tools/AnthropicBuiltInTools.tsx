import { Button, Divider, Group, Modal, MultiSelect, NumberInput, Stack, Switch, Text, TextInput } from '@mantine/core'
import { RiSearchLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useFormContext } from '~/lib/ContextForm'
import useAiStore from '~/lib/store/aiStore'

export default function AnthropicBuiltInTools() {
  const form = useFormContext()
  const [modalOpened, setModalOpened] = useState(false)
  const { selectedAgent } = useAiStore()

  //set default values
  useEffect(() => {
    if (selectedAgent) {
      // Set web search parameters
      form.setFieldValue('builtInTools.web_search_parameters', {
        enabled: selectedAgent?.settings?.builtInTools?.web_search_parameters?.enabled || false,
        max_uses: selectedAgent?.settings?.builtInTools?.web_search_parameters?.max_uses || 5,
        allowed_domains: selectedAgent?.settings?.builtInTools?.web_search_parameters?.allowed_domains || [],
        blocked_domains: selectedAgent?.settings?.builtInTools?.web_search_parameters?.blocked_domains || [],
        user_location: selectedAgent?.settings?.builtInTools?.web_search_parameters?.user_location || {
          city: '',
          region: '',
          country: '',
          timezone: '',
        },
      })
    }
  }, [])

  return (
    <>
      <Button justify="space-between" fullWidth variant="light" size="sm" rightSection={<RiSearchLine size={16} />} onClick={() => setModalOpened(true)}>
        {`WebSearch (${form.getValues().builtInTools?.web_search_parameters?.enabled ? 'on' : 'off'})`}
      </Button>

      {/* Configuration Modal */}
      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Web Search Configuration" size="lg">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Anthropic models support web search for real-time information. Configure the web search tool to control when and how it searches the web.
          </Text>

          {/* Web Search Configuration */}
          <Stack gap="md">
            {/* Enable/Disable Web Search */}
            <Switch
              label="Enable Web Search"
              checked={form.getValues().builtInTools?.web_search_parameters?.enabled}
              description="Allow the model to search the web for real-time information"
              {...form.getInputProps('builtInTools.web_search_parameters.enabled')}
              key={form.key('builtInTools.web_search_parameters.enabled')}
            />

            {form.getValues().builtInTools?.web_search_parameters?.enabled && (
              <>
                {/* Max Uses */}
                <NumberInput
                  label="Maximum Search Uses"
                  description="Maximum number of web searches per request (default: 5)"
                  placeholder="5"
                  min={1}
                  max={20}
                  {...form.getInputProps('builtInTools.web_search_parameters.max_uses')}
                />

                <Divider label="Domain Filtering" labelPosition="center" />

                {/* Domain Filtering */}
                <Text size="sm" c="dimmed">
                  You can use either allowed domains or blocked domains, but not both in the same request.
                </Text>

                {/* Allowed Domains */}
                <MultiSelect
                  label="Allowed Domains"
                  description="Only include results from these domains (leave empty to allow all)"
                  placeholder="Enter domain names (e.g., example.com)"
                  data={[]}
                  searchable
                  {...form.getInputProps('builtInTools.web_search_parameters.allowed_domains')}
                />

                {/* Blocked Domains */}
                <MultiSelect
                  label="Blocked Domains"
                  description="Never include results from these domains"
                  placeholder="Enter domain names (e.g., untrustedsource.com)"
                  data={[]}
                  searchable
                  {...form.getInputProps('builtInTools.web_search_parameters.blocked_domains')}
                />

                <Divider label="Localization" labelPosition="center" />

                {/* User Location */}
                <Stack gap="sm">
                  <Text size="sm" fw={500}>
                    User Location (Optional)
                  </Text>
                  <Text size="xs" c="dimmed">
                    Localize search results based on user location
                  </Text>

                  <Group grow>
                    <TextInput
                      key={form.key('builtInTools.web_search_parameters.user_location.city')}
                      label="City"
                      placeholder="San Francisco"
                      {...form.getInputProps('builtInTools.web_search_parameters.user_location.city')}
                    />
                    <TextInput
                      key={form.key('builtInTools.web_search_parameters.user_location.region')}
                      label="Region/State"
                      placeholder="California"
                      {...form.getInputProps('builtInTools.web_search_parameters.user_location.region')}
                    />
                  </Group>

                  <Group grow>
                    <TextInput
                      key={form.key('builtInTools.web_search_parameters.user_location.country')}
                      label="Country"
                      placeholder="US"
                      {...form.getInputProps('builtInTools.web_search_parameters.user_location.country')}
                    />
                    <TextInput
                      key={form.key('builtInTools.web_search_parameters.user_location.timezone')}
                      label="Timezone"
                      placeholder="America/Los_Angeles"
                      {...form.getInputProps('builtInTools.web_search_parameters.user_location.timezone')}
                    />
                  </Group>
                </Stack>

                {/* Information about supported models */}
                <Divider label="Supported Models" labelPosition="center" />
                <Text size="sm" c="dimmed">
                  Web search is available on: Claude Opus 4, Claude Sonnet 4, Claude Sonnet 3.7, Claude Sonnet 3.5, and Claude Haiku 3.5.
                </Text>
              </>
            )}
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
