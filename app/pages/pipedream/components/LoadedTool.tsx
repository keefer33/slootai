import { Badge, Card, Divider, Group, Stack, Text } from '@mantine/core'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import { renderMarkdownLinks } from '~/lib/utils'
import PipedreamToolCard from '~/pages/pipedream/components/PipedreamToolCard'
import { SchemaFormPipedream } from '~/pages/pipedream/components/SchemaFormPipedream'
import { ConnectButton } from '~/shared/ConnectButton'

interface LoadedToolProps {
  selectedApp: any
  selectedComponent: any
  isConnected: boolean
  selectedAccount: any
  isMobile: boolean
}

export function LoadedTool({ selectedApp, selectedComponent, isConnected, selectedAccount, isMobile }: LoadedToolProps) {
  const { getSelectedAccount } = usePipedreamStore()
  // Transform the selected component to get the schema
  const { transformPipedreamToTool } = usePipedreamStore()
  const transformedComponent = selectedComponent ? transformPipedreamToTool(selectedComponent) : null

  return (
    <Stack gap="md" pr={isMobile ? '0' : 'md'}>
      <Divider label="Component Details" labelPosition="center" />
      {selectedComponent ? (
        <Stack gap="sm">
          <PipedreamToolCard
            title={selectedComponent.name}
            description={renderMarkdownLinks(selectedComponent.description)}
            metadata={{
              key: selectedComponent.key,
              version: selectedComponent.version,
            }}
          >
            <Stack gap="xs" mt="sm">
              {/* Display the transformed schema when connected */}
              {transformedComponent && isConnected ? (
                <>
                  <SchemaFormPipedream schema={transformedComponent.inputSchema} app={selectedAccount} nameKey={transformedComponent.name} />
                </>
              ) : (
                /* Show configurable props when not connected */
                <>
                  <Text c="dimmed" ta="center" py="md">
                    Please connect your account to use this tool
                  </Text>
                  <Group justify="center">
                    <ConnectButton accountId={getSelectedAccount()?.id} app={selectedApp} />
                  </Group>
                  <Divider label="Configurable Properties" labelPosition="center" />
                  <Stack gap="xs" mt="sm">
                    {selectedComponent.configurableProps?.map((prop: any, idx: number) => (
                      <Card key={idx} padding="sm" radius="sm" withBorder>
                        <Stack gap={2}>
                          <Text fw={500}>
                            {prop.label || prop.name} ({prop.type})
                          </Text>
                          <Text size="xs" c="dimmed">
                            {prop.description}
                          </Text>
                          {prop.optional && (
                            <Badge color="gray" variant="light">
                              Optional
                            </Badge>
                          )}
                          {'default' in prop && <Text size="xs">Default: {String(prop.default)}</Text>}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </PipedreamToolCard>
        </Stack>
      ) : (
        <Text c="dimmed" ta="center" py="md">
          Select a component from the left to view its details.
        </Text>
      )}
    </Stack>
  )
}
