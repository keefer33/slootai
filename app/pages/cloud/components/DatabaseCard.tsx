import { Anchor, Card, Group, Stack, Text } from '@mantine/core'
import { RiExternalLinkLine } from '@remixicon/react'
import type { ReactNode } from 'react'

// Utility function to clean SVG content
const cleanSvgContent = (svg: string): string => {
  return svg.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
}

interface DatabaseCardProps {
  name: string
  description: string
  logo: string
  homeUrl?: string
  onClick: () => void
  children?: ReactNode
}

export default function DatabaseCard({ name, description, logo, homeUrl, onClick, children }: DatabaseCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h={320} style={{ cursor: 'pointer' }} onClick={onClick}>
      <Stack gap="md" h="100%">
        {/* Header Section - Fixed Height */}
        <Group gap="md" h={60} align="flex-start">
          <div
            dangerouslySetInnerHTML={{
              __html: cleanSvgContent(logo),
            }}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text fw={600} size="lg" lineClamp={1}>
              {name}
            </Text>
          </Stack>
        </Group>

        {/* Description Section - Fixed Height */}
        <Stack gap="xs" h={90}>
          <Text size="sm" c="dimmed" lineClamp={4}>
            {description}
          </Text>
        </Stack>

        {/* External Link Section - Fixed Height */}
        {homeUrl && (
          <Stack gap="xs" h={40}>
            <Anchor
              href={homeUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              c="blue"
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RiExternalLinkLine size={14} />
              Visit Website
            </Anchor>
          </Stack>
        )}

        {/* Children Section - Fixed Height */}
        <Stack gap="xs" h={60} justify="flex-end">
          {children}
        </Stack>
      </Stack>
    </Card>
  )
}
