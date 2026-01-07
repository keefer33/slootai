import { ActionIcon, Badge, Box, Card, Group, Stack, Text, Tooltip, useMantineColorScheme } from '@mantine/core'
import { RiInformationLine } from '@remixicon/react'

interface PipedreamToolCardProps {
  title: string
  description?: string | React.ReactNode
  badge?: {
    text: string
    color: string
  }
  metadata?: {
    key?: string
    version?: string
  }
  children?: React.ReactNode
}

export default function PipedreamToolCard({ title, description, badge, metadata, children }: PipedreamToolCardProps) {
  const { colorScheme } = useMantineColorScheme()

  return (
    <Card shadow="sm" padding="xs" radius="md">
      {/* Colored Header Section */}
      <Card.Section bg={colorScheme === 'dark' ? 'dark.5' : 'gray.1'} p="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Text fw={600} size="md" lineClamp={1}>
              {title}
            </Text>
            {badge && (
              <Badge color={badge.color} variant="filled" size="sm">
                {badge.text}
              </Badge>
            )}
          </Group>

          {metadata && (
            <ActionIcon variant="subtle" color="gray" size="sm">
              <Tooltip label="Tool Information" withArrow>
                <RiInformationLine size={16} />
              </Tooltip>
            </ActionIcon>
          )}
        </Group>
      </Card.Section>

      {/* Description Section */}
      {description && (
        <Card.Section p="xs">
          <Box>
            <Text size="sm" color="dimmed" fw={500} lineClamp={3}>
              {description}
            </Text>
          </Box>
        </Card.Section>
      )}

      {/* Metadata Section */}
      {metadata && (
        <Card.Section p="xs">
          <Stack gap="xs">
            {metadata.key && (
              <Group gap="xs">
                <Text size="xs" fw={600} c="dimmed">
                  Key:
                </Text>
                <Text size="xs">{metadata.key}</Text>
              </Group>
            )}
          </Stack>
        </Card.Section>
      )}

      {/* Children Content */}
      {children && <Card.Section p="xs">{children}</Card.Section>}
    </Card>
  )
}
