import { ActionIcon, Badge, Box, Card, Group, Image, Stack, Text, Tooltip, useMantineColorScheme } from '@mantine/core'
import { RiExternalLinkLine } from '@remixicon/react'

interface CloudServiceCardProps {
  name: string
  description?: string
  category?: string
  tags?: string[]
  logo?: string
  homeUrl?: string
  onClick?: () => void
  children?: React.ReactNode
}

export default function CloudServiceCard({ name, description, category, tags, logo, homeUrl, onClick, children }: CloudServiceCardProps) {
  const { colorScheme } = useMantineColorScheme()

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      ai: 'blue',
      analytics: 'indigo',
      auth: 'red',
      automation: 'green',
      backend: 'orange',
      cms: 'purple',
      ci: 'yellow',
      database: 'cyan',
      devtools: 'teal',
      email: 'pink',
      git: 'violet',
      media: 'grape',
      messaging: 'lime',
      mattermost: 'blue',
      monitoring: 'red',
      productivity: 'purple',
      proxy: 'gray',
      search: 'yellow',
      security: 'pink',
      storage: 'grape',
      vpn: 'indigo',
      vps: 'orange',
    }
    return colors[category?.toLowerCase() || ''] || 'gray'
  }

  return (
    <Card shadow="sm" padding="xs" radius="md" style={{ cursor: onClick ? 'pointer' : 'default', height: '320px' }} onClick={onClick}>
      {/* Colored Header Section - Fixed Height */}
      <Card.Section bg={colorScheme === 'dark' ? 'dark.5' : 'gray.1'} p="xs" style={{ height: '60px' }}>
        <Group justify="space-between" align="center" h="100%">
          <Group gap="xs" align="center">
            {logo && <Image src={logo} alt={name} w={24} h={24} fit="contain" fallbackSrc="/placeholder-icon.png" />}
            <Text fw={600} size="md" lineClamp={1}>
              {name}
            </Text>
          </Group>

          <Group gap="xs">
            {homeUrl && (
              <ActionIcon
                variant="subtle"
                color="blue"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(homeUrl, '_blank')
                }}
              >
                <Tooltip label="Visit Website" withArrow>
                  <RiExternalLinkLine size={16} />
                </Tooltip>
              </ActionIcon>
            )}
          </Group>
        </Group>
      </Card.Section>

      {/* Category Section - Fixed Height */}
      {category && (
        <Card.Section p="xs" style={{ height: '40px' }}>
          <Box h="100%" style={{ display: 'flex', alignItems: 'center' }}>
            <Badge color={getCategoryColor(category)} variant="filled" size="sm">
              {category}
            </Badge>
          </Box>
        </Card.Section>
      )}

      {/* Description Section - Fixed Height */}
      <Card.Section p="xs" style={{ height: '90px' }}>
        <Box h="100%">
          <Text size="sm" color="dimmed" fw={500} lineClamp={3} h="100%">
            {description || 'No description available'}
          </Text>
        </Box>
      </Card.Section>

      {/* Tags Section - Fixed Height */}
      <Card.Section p="xs" style={{ height: '60px' }}>
        <Stack gap="xs" h="100%" justify="center">
          <Group gap="xs" wrap="wrap">
            {tags && tags.length > 0 ? (
              <>
                {tags.slice(0, 4).map((tag, index) => (
                  <Badge key={index} size="xs" variant="outline" color="gray">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 4 && (
                  <Badge size="xs" variant="outline" color="gray">
                    +{tags.length - 4}
                  </Badge>
                )}
              </>
            ) : (
              <Text size="xs" color="dimmed">
                No tags
              </Text>
            )}
          </Group>
        </Stack>
      </Card.Section>

      {/* Children Content - Fixed Height */}
      <Card.Section p="xs" style={{ height: '60px' }}>
        <Box h="100%" style={{ display: 'flex', alignItems: 'center' }}>
          {children}
        </Box>
      </Card.Section>
    </Card>
  )
}
