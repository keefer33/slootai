import { Button, Divider, Group, Modal, MultiSelect, NumberInput, Select, Stack, Switch, Text, TextInput } from '@mantine/core'
import { RiSearchLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useFormContext } from '~/lib/ContextForm'
import useAiStore from '~/lib/store/aiStore'

export default function XaiBuiltInTools() {
  const form = useFormContext()
  const [modalOpened, setModalOpened] = useState(false)
  const { getSelectedAgent } = useAiStore()

  // Initialize search_parameters if it doesn't exist
  useEffect(() => {
    if (!getSelectedAgent().settings.builtInTools?.search_parameters) {
      form.setFieldValue('builtInTools.search_parameters', {
        mode: 'off',
        return_citations: true,
        max_search_results: 20,
        sources: [], // Initialize empty sources array
      })
    }
  }, []) // Only run once on mount

  return (
    <>
      <Button justify="space-between" fullWidth variant="light" size="sm" rightSection={<RiSearchLine size={16} />} onClick={() => setModalOpened(true)}>
        {`Search (${getSelectedAgent()?.settings?.builtInTools?.search_parameters?.mode || 'off'})`}
      </Button>

      {/* Configuration Modal */}
      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Live Search Configuration" size="lg">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            XAI models support tool calling and can use custom tools defined in your agent settings. Built-in capabilities include image generation, web search, and various utility
            functions.
          </Text>

          {/* Search Configuration */}
          <Stack gap="md">
            {/* Search Mode */}
            <Select
              key={form.key('builtInTools.search_parameters.mode')}
              label="Search Mode"
              description="Controls when and how search is performed"
              placeholder="Select search mode"
              data={[
                { value: 'off', label: 'Off - Disable search completely' },
                { value: 'auto', label: 'Auto - Model decides when to search (default)' },
                { value: 'on', label: 'On - Always enable search' },
              ]}
              defaultValue="auto"
              {...form.getInputProps('builtInTools.search_parameters.mode')}
            />

            {(getSelectedAgent()?.settings?.builtInTools?.search_parameters?.mode === 'auto' || getSelectedAgent()?.settings?.builtInTools?.search_parameters?.mode === 'on') && (
              <>
                {/* Return Citations */}
                <Switch
                  key={form.key('builtInTools.search_parameters.return_citations')}
                  label="Return Citations"
                  description="Include citations to data sources in the response (default: true)"
                  defaultChecked={true}
                  {...form.getInputProps('builtInTools.search_parameters.return_citations')}
                />

                {/* Max Search Results */}
                <NumberInput
                  key={form.key('builtInTools.search_parameters.max_search_results')}
                  label="Max Search Results"
                  description="Maximum number of data sources to consider (default: 20)"
                  placeholder="20"
                  min={1}
                  max={50}
                  defaultValue={20}
                  {...form.getInputProps('builtInTools.search_parameters.max_search_results')}
                />

                {/* Date Range */}
                <Group grow>
                  <TextInput
                    key={form.key('builtInTools.search_parameters.from_date')}
                    label="From Date"
                    description="Start date for search data (ISO format: YYYY-MM-DD)"
                    placeholder="YYYY-MM-DD"
                    {...form.getInputProps('builtInTools.search_parameters.from_date')}
                  />
                  <TextInput
                    key={form.key('builtInTools.search_parameters.to_date')}
                    label="To Date"
                    description="End date for search data (ISO format: YYYY-MM-DD)"
                    placeholder="YYYY-MM-DD"
                    {...form.getInputProps('builtInTools.search_parameters.to_date')}
                  />
                </Group>

                <Divider label="Data Sources" labelPosition="center" />

                {/* Data Sources */}
                <Stack gap="sm">
                  <Text size="sm" fw={500}>
                    Data Sources
                  </Text>
                  <Text size="xs" c="dimmed" mb="xs">
                    Select which data sources to use for search
                  </Text>

                  {[
                    { type: 'web', label: 'Web Search' },
                    { type: 'x', label: 'X (Twitter) Posts' },
                    { type: 'news', label: 'News Sources' },
                    { type: 'rss', label: 'RSS Feeds' },
                  ].map((source) => {
                    const currentSources = form.getValues().builtInTools?.search_parameters?.sources || []
                    const isSelected = currentSources.some((s: any) => s.type === source.type)

                    return (
                      <Switch
                        key={source.type}
                        label={source.label}
                        checked={isSelected}
                        onChange={(event) => {
                          const currentSources = form.getValues().builtInTools?.search_parameters?.sources || []
                          if (event.currentTarget.checked) {
                            // Add source if not already present
                            if (!currentSources.some((s: any) => s.type === source.type)) {
                              form.setFieldValue('builtInTools.search_parameters.sources', [...currentSources, { type: source.type }])
                            }
                          } else {
                            // Remove source
                            form.setFieldValue(
                              'builtInTools.search_parameters.sources',
                              currentSources.filter((s: any) => s.type !== source.type),
                            )
                          }
                        }}
                      />
                    )
                  })}
                </Stack>

                {/* Web Source Configuration */}
                {getSelectedAgent()?.settings?.builtInTools?.search_parameters?.sources?.some((source: any) => source.type === 'web') && (
                  <Stack gap="sm" ml="md">
                    <Text size="sm" fw={500}>
                      Web Search Configuration
                    </Text>

                    <TextInput
                      key={form.key('builtInTools.search_parameters.web_country')}
                      label="Country (ISO Code)"
                      description="Limit results to specific country (e.g., US, CH, GB)"
                      placeholder="US"
                      {...form.getInputProps('builtInTools.search_parameters.web_country')}
                    />

                    <MultiSelect
                      key={form.key('builtInTools.search_parameters.web_excluded_sites')}
                      label="Excluded Websites"
                      description="Websites to exclude from search (max 5)"
                      placeholder="Enter website domains"
                      data={[]}
                      searchable
                      {...form.getInputProps('builtInTools.search_parameters.web_excluded_sites')}
                    />

                    <MultiSelect
                      key={form.key('builtInTools.search_parameters.web_allowed_sites')}
                      label="Allowed Websites"
                      description="Only search these websites (max 5)"
                      placeholder="Enter website domains"
                      data={[]}
                      searchable
                      {...form.getInputProps('builtInTools.search_parameters.web_allowed_sites')}
                    />

                    <Switch
                      key={form.key('builtInTools.search_parameters.web_safe_search')}
                      label="Safe Search"
                      description="Enable safe search filtering (default: true)"
                      defaultChecked={true}
                      {...form.getInputProps('builtInTools.search_parameters.web_safe_search')}
                    />
                  </Stack>
                )}

                {/* X Source Configuration */}
                {getSelectedAgent()?.settings?.builtInTools?.search_parameters?.sources?.some((source: any) => source.type === 'x') && (
                  <Stack gap="sm" ml="md">
                    <Text size="sm" fw={500}>
                      X (Twitter) Configuration
                    </Text>

                    <MultiSelect
                      key={form.key('builtInTools.search_parameters.x_included_handles')}
                      label="Included X Handles"
                      description="Only consider posts from these handles (max 10)"
                      placeholder="Enter X handles"
                      data={[]}
                      searchable
                      {...form.getInputProps('builtInTools.search_parameters.x_included_handles')}
                    />

                    <MultiSelect
                      key={form.key('builtInTools.search_parameters.x_excluded_handles')}
                      label="Excluded X Handles"
                      description="Exclude posts from these handles (max 10)"
                      placeholder="Enter X handles"
                      data={[]}
                      searchable
                      {...form.getInputProps('builtInTools.search_parameters.x_excluded_handles')}
                    />

                    <NumberInput
                      key={form.key('builtInTools.search_parameters.x_min_favorites')}
                      label="Minimum Favorite Count"
                      description="Only consider posts with at least this many favorites"
                      placeholder="1000"
                      min={0}
                      {...form.getInputProps('builtInTools.search_parameters.x_min_favorites')}
                    />

                    <NumberInput
                      key={form.key('builtInTools.search_parameters.x_min_views')}
                      label="Minimum View Count"
                      description="Only consider posts with at least this many views"
                      placeholder="20000"
                      min={0}
                      {...form.getInputProps('builtInTools.search_parameters.x_min_views')}
                    />
                  </Stack>
                )}

                {/* News Source Configuration */}
                {getSelectedAgent()?.settings?.builtInTools?.search_parameters?.sources?.some((source: any) => source.type === 'news') && (
                  <Stack gap="sm" ml="md">
                    <Text size="sm" fw={500}>
                      News Configuration
                    </Text>

                    <TextInput
                      key={form.key('builtInTools.search_parameters.news_country')}
                      label="Country (ISO Code)"
                      description="Limit news to specific country (e.g., US, CH, GB)"
                      placeholder="US"
                      {...form.getInputProps('builtInTools.search_parameters.news_country')}
                    />

                    <MultiSelect
                      key={form.key('builtInTools.search_parameters.news_excluded_sites')}
                      label="Excluded News Sites"
                      description="News sites to exclude from search (max 5)"
                      placeholder="Enter news site domains"
                      data={[]}
                      searchable
                      {...form.getInputProps('builtInTools.search_parameters.news_excluded_sites')}
                    />

                    <Switch
                      key={form.key('builtInTools.search_parameters.news_safe_search')}
                      label="Safe Search"
                      description="Enable safe search filtering (default: true)"
                      defaultChecked={true}
                      {...form.getInputProps('builtInTools.search_parameters.news_safe_search')}
                    />
                  </Stack>
                )}

                {/* RSS Source Configuration */}
                {getSelectedAgent()?.settings?.builtInTools?.search_parameters?.sources?.some((source: any) => source.type === 'rss') && (
                  <Stack gap="sm" ml="md">
                    <Text size="sm" fw={500}>
                      RSS Configuration
                    </Text>

                    <TextInput
                      key={form.key('builtInTools.search_parameters.rss_url')}
                      label="RSS Feed URL"
                      description="URL of the RSS feed to fetch data from"
                      placeholder="https://status.x.ai/feed.xml"
                      {...form.getInputProps('builtInTools.search_parameters.rss_url')}
                    />
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
