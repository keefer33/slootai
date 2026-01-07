import { Box, Container, Group, useMantineColorScheme } from '@mantine/core'
import { useHeadroom } from '@mantine/hooks'
import Logo from './Logo'
import { UserMenu } from './UserMenu'

export function StickyHeader() {
  const { colorScheme } = useMantineColorScheme()
  const pinned = useHeadroom()

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: `translateY(${pinned ? 0 : '-100%'})`,
        transition: 'transform 400ms ease',
        background: colorScheme === 'dark' ? 'rgba(26, 27, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${colorScheme === 'dark' ? '#373a40' : '#dee2e6'}`,
      }}
    >
      <Container size="lg" py="sm">
        <Group h={60} px="md" justify="space-between">
          {/* Logo and Brand */}
          <Group gap="sm">
            <Logo />
          </Group>

          {/* Right side - Theme switcher and user menu */}
          <Group gap="xs">
            {/* User Menu */}
            <UserMenu />
          </Group>
        </Group>
      </Container>
    </Box>
  )
}
