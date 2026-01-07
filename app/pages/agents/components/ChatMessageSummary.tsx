import { ActionIcon, Anchor, Badge, Button, Card, Divider, Group, Image, Modal, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiBrainLine, RiCoinsLine, RiExchangeDollarLine, RiEyeLine, RiEyeOffLine, RiMoneyDollarCircleLine, RiToolsLine } from '@remixicon/react'
import { useState } from 'react'
import { DisplayJsonCodeMirror } from '~/shared/DisplayJsonCodeMirror'
import PollingFile from '~/shared/PollingFile'

interface TokenDetails {
  cached_tokens?: number
}

interface OriginalUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  prompt_tokens_details: TokenDetails
  prompt_cache_hit_tokens: number
  prompt_cache_miss_tokens: number
}

interface Breakdown {
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cached_tokens?: number
}

interface Pricing {
  brand: string
  model: string
  input_per_1k: number
  output_per_1k: number
}

interface Costs {
  input_cost: number
  output_cost: number
  total_cost: number
  cache_savings?: number
}

interface ModelUsage {
  type: 'model'
  brand: string
  model: string
  original: OriginalUsage
  breakdown: Breakdown
  pricing: Pricing
  costs: Costs
}

interface ToolUsage {
  type: 'tool'
  toolName: string
  toolId: string
  output: {
    type: string
    content: string
  }
  total_cost: number
}

type UsageItem = ModelUsage | ToolUsage

interface MessageJson {
  json: any
  title?: string
}

interface Message {
  usage?: UsageItem[]
  json?: MessageJson[]
  fullMessage?: any[]
}

interface ChatMessageSummaryProps {
  message: Message
  buttonText?: string
  buttonVariant?: 'default' | 'filled' | 'light' | 'outline' | 'subtle' | 'transparent' | 'white' | 'gradient'
  icon?: 'summary' | 'history'
}

export function ChatMessageSummary({ message, buttonVariant = 'light', icon = 'summary' }: ChatMessageSummaryProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [visibleJsonSection, setVisibleJsonSection] = useState<'usage' | 'message' | null>(null)
  console.log('message', message)
  const usageData = message.usage || []
  const isModelUsage = (item: UsageItem): item is ModelUsage => {
    return item.type === 'model'
  }

  const isToolUsage = (item: UsageItem): item is ToolUsage => {
    return item.type === 'tool'
  }

  const totalCost = usageData.reduce((sum, item) => {
    if (isModelUsage(item)) {
      return sum + item.costs.total_cost
    }
    if (isToolUsage(item) && item.output.type !== 'polling-file') {
      return sum + (item.total_cost || 0)
    }
    return sum
  }, 0)

  const modelUsage = usageData.filter(isModelUsage)
  const toolUsage = usageData.filter(isToolUsage)

  const totalInputTokens = modelUsage.reduce((sum, item) => sum + item.breakdown.input_tokens, 0)
  const totalOutputTokens = modelUsage.reduce((sum, item) => sum + item.breakdown.output_tokens, 0)
  const totalCachedTokens = modelUsage.reduce((sum, item) => sum + (item.breakdown.cached_tokens || 0), 0)
  const totalCacheSavings = modelUsage.reduce((sum, item) => sum + (item.costs.cache_savings || 0), 0)

  const formatCost = (cost: number) => {
    // Handle NaN, undefined, or null values
    if (isNaN(cost) || cost == null) {
      return '$0.0000'
    }
    // Round up to 4 decimal places
    const roundedCost = Math.ceil(cost * 10000) / 10000
    return `$${roundedCost.toFixed(4)}`
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`
    }
    return tokens.toString()
  }

  const toggleJsonSection = (section: 'usage' | 'message') => {
    if (visibleJsonSection === section) {
      setVisibleJsonSection(null)
    } else {
      setVisibleJsonSection(section)
    }
  }

  const renderToolOutput = (output: ToolUsage['output']) => {
    if (!output || !output.type) {
      return (
        <Text size="xs" c="dimmed">
          No output data
        </Text>
      )
    }

    if (output.type === 'image_url') {
      return (
        <Group gap="xs" align="center">
          <Image src={output.content} alt="Tool output" width={40} height={40} fit="cover" radius="sm" />
          <Anchor href={output.content} target="_blank" rel="noopener noreferrer" size="xs" c="blue">
            View Image
          </Anchor>
        </Group>
      )
    }

    if (output.type === 'polling-file') {
      return (
        <Group gap="xs" align="center">
          <PollingFile pollingFileId={output.content} />
        </Group>
      )
    }

    return (
      <Text size="xs" c="dimmed">
        {output.type}
      </Text>
    )
  }

  return (
    <>
      <ActionIcon variant={buttonVariant} onClick={open} size="md">
        {icon === 'summary' ? <RiMoneyDollarCircleLine size={24} /> : <RiExchangeDollarLine size={24} />}
      </ActionIcon>

      <Modal
        opened={opened}
        onClose={close}
        title="Message Details"
        size="xl"
        styles={{
          title: { fontSize: '1.2rem', fontWeight: 600 },
        }}
      >
        <Stack gap="md">
          {/* Cost Summary Section - only show if there's usage data */}
          {usageData.length > 0 && (
            <>
              {/* Header with total cost */}
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <RiCoinsLine size={25} />
                  <Text size="lg" fw={600}>
                    Cost Summary
                  </Text>
                </Group>
                <Badge size="lg" variant="filled">
                  Total: {formatCost(totalCost)}
                </Badge>
              </Group>

              <Divider />

              {/* Model Usage Summary */}
              {modelUsage.length > 0 && (
                <Stack gap="sm">
                  <Group gap="xs">
                    <RiBrainLine size={20} />
                    <Text size="sm" fw={600}>
                      Model Usage
                    </Text>
                  </Group>

                  <Group gap="md" wrap="wrap">
                    <Badge variant="light" color="blue">
                      Input: {formatTokens(totalInputTokens)} tokens
                    </Badge>
                    <Badge variant="light" color="green">
                      Output: {formatTokens(totalOutputTokens)} tokens
                    </Badge>
                    {totalCachedTokens > 0 && (
                      <Badge variant="light" color="orange">
                        Cached: {formatTokens(totalCachedTokens)} tokens
                      </Badge>
                    )}
                    {totalCacheSavings > 0 && (
                      <Badge variant="light" color="teal">
                        Cache Savings: {formatCost(totalCacheSavings)}
                      </Badge>
                    )}
                  </Group>

                  {/* Individual model breakdowns */}
                  {modelUsage.map((item, index) => (
                    <Card key={index} p="xs" variant="subtle">
                      <Group justify="space-between" align="center">
                        <Stack gap={4}>
                          <Text size="sm" fw={500}>
                            {item.brand}/{item.model}
                          </Text>
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              {formatTokens(item.breakdown.input_tokens)} in, {formatTokens(item.breakdown.output_tokens)} out
                            </Text>
                            {item.breakdown.cached_tokens !== undefined && item.breakdown.cached_tokens > 0 && (
                              <Text size="xs" c="dimmed">
                                ({formatTokens(item.breakdown.cached_tokens)} cached)
                              </Text>
                            )}
                          </Group>
                        </Stack>
                        <Group justify="flex-end">
                          <Text size="sm" fw={600}>
                            {formatCost(item.costs.total_cost)}
                          </Text>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                  <Group justify="flex-end">
                    <Text size="sm" fw={600}>
                      {formatCost(modelUsage.reduce((sum, item) => sum + item.costs.total_cost, 0))}
                    </Text>
                  </Group>
                </Stack>
              )}

              {/* Tool Usage Summary */}
              {toolUsage.length > 0 && (
                <Stack gap="sm">
                  <Group gap="xs">
                    <RiToolsLine size={16} />
                    <Text size="sm" fw={600}>
                      Tool Usage
                    </Text>
                  </Group>

                  {toolUsage.map((item, index) => (
                    <Card key={index} p="xs" variant="subtle">
                      <Group justify="space-between" align="center">
                        <Stack gap={4}>
                          <Text size="sm" fw={500}>
                            {item.toolName || 'Unknown Tool'}
                          </Text>
                          {renderToolOutput(item.output)}
                        </Stack>
                        <Text size="sm" fw={600}>
                          {item.output?.type === 'polling-file' ? 'Cost Pending' : formatCost(item.total_cost || 0)}
                        </Text>
                      </Group>
                    </Card>
                  ))}
                  <Group justify="flex-end">
                    <Text size="sm" fw={600}>
                      {formatCost(
                        toolUsage.reduce((sum, item) => {
                          // Exclude polling-file items from total cost calculation
                          if (item.output?.type === 'polling-file') {
                            return sum
                          }
                          return sum + (item.total_cost || 0)
                        }, 0),
                      )}
                    </Text>
                  </Group>
                </Stack>
              )}

              {/* Cost Breakdown */}
              <Divider />
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <RiCoinsLine size={20} />
                  <Text size="sm" fw={600}>
                    Total Cost
                  </Text>
                </Group>
                <Text size="sm" fw={600}>
                  {formatCost(totalCost)}
                </Text>
              </Group>
            </>
          )}

          {/* JSON Data Section - only show if there's JSON data */}
          {(usageData.length > 0 || message.fullMessage.length > 0) && <Divider />}

          <Stack gap="xs">
            <Group gap="sm">
              {usageData.length > 0 && (
                <Button
                  variant={visibleJsonSection === 'usage' ? 'filled' : 'light'}
                  leftSection={visibleJsonSection === 'usage' ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  onClick={() => toggleJsonSection('usage')}
                  size="sm"
                >
                  {visibleJsonSection === 'usage' ? 'Hide Usage JSON' : 'Show Usage JSON'}
                </Button>
              )}
              {message.fullMessage.length > 0 && (
                <Button
                  variant={visibleJsonSection === 'message' ? 'filled' : 'light'}
                  leftSection={visibleJsonSection === 'message' ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  onClick={() => toggleJsonSection('message')}
                  size="sm"
                >
                  {visibleJsonSection === 'message' ? 'Hide Message JSON' : 'Show Message JSON'}
                </Button>
              )}
            </Group>

            {visibleJsonSection === 'usage' && usageData.length > 0 && (
              <DisplayJsonCodeMirror value={JSON.stringify(message.usage, null, 2)} onChange={() => {}} readOnly showTitle={false} />
            )}

            {visibleJsonSection === 'message' && message.fullMessage.length > 0 && (
              <DisplayJsonCodeMirror value={JSON.stringify(message.fullMessage, null, 2)} onChange={() => {}} readOnly showTitle={false} />
            )}
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
