import { Group, Text, useMantineTheme } from '@mantine/core'
import { RiMeteorLine } from '@remixicon/react'
import useAiStore from '~/lib/store/aiStore'

export default function Logo({ size = 36, fontSize = '34px', fontSizeSmall = '20px' }: { size?: number, fontSize?: string, fontSizeSmall?: string }) {
  const theme = useMantineTheme()
  const { themeColor } = useAiStore()
  const themeSettings = {
    fontFamily: 'Lilita One, sans-serif',
    letterSpacing: '1.5px',
    fontSize: fontSize,
    fontWeight: 900,
    fontSizeSmall: fontSizeSmall,
    fontWeightSmall: 400,
    letterSpacingSmall: '0.5px',
  }

  return (
    <Group gap="0">
      <RiMeteorLine size={size} color={theme.colors[themeColor][6]} />
      <Group gap={0} align="baseline">
        <Text
          size={themeSettings.fontSize}
          fw={themeSettings.fontWeight}
          style={{
            fontFamily: themeSettings.fontFamily,
            color: theme.colors[themeColor][6],
            letterSpacing: themeSettings.letterSpacing,
          }}
        >
          SlooT
        </Text>
        <Text
          size={themeSettings.fontSizeSmall}
          fw={themeSettings.fontWeightSmall}
          c="dimmed"
          style={{
            fontFamily: themeSettings.fontFamily,
            letterSpacing: themeSettings.letterSpacingSmall,
          }}
        >
          .ai
        </Text>
      </Group>
    </Group>
  )
}
