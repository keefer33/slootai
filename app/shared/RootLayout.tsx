import { AppShell, Box, Burger, ScrollArea, Stack, Text, useMantineColorScheme } from '@mantine/core'
import { useDisclosure, useMounted } from '@mantine/hooks'
import { Notifications } from '@mantine/notifications'
import { Outlet } from 'react-router'
import Logo from './Logo'
import { Navbar } from './Navbar'
import { StickyHeader } from './StickyHeader'

export default function RootLayout() {
  const mounted = useMounted()
  const { colorScheme } = useMantineColorScheme()
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()

  return (
    <>
      {mounted && (
        <>
          <Notifications />

          {/* Sticky Header */}
          <StickyHeader />

          <AppShell
            layout="alt"
            header={{ height: 0 }} // Remove header since we're using sticky header
            navbar={{
              width: 200,
              breakpoint: 'sm',
              collapsed: { mobile: !mobileOpened },
            }}
            padding="0"
            withBorder={false}
            pt={60} // Add padding top to account for fixed header
          >
            {/* Mobile Burger Menu */}
            <Box
              style={{
                position: 'fixed',
                top: 60,
                left: 0,
                zIndex: 999,
                padding: '8px',
                background: colorScheme === 'dark' ? 'rgba(26, 27, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${colorScheme === 'dark' ? '#373a40' : '#dee2e6'}`,
              }}
              hiddenFrom="sm"
            >
              <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" />
            </Box>

            <AppShell.Navbar p="0" bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'}>
              <AppShell.Section>
                <Stack gap="0" align="center" py="md">
                  <Logo />
                  <Text c="dimmed">Sloot (Tools) AI</Text>
                </Stack>
              </AppShell.Section>
              <AppShell.Section grow component={ScrollArea}>
                <Navbar toggleMobile={toggleMobile} />
              </AppShell.Section>
            </AppShell.Navbar>
            <AppShell.Main>
              <Outlet />
            </AppShell.Main>
          </AppShell>
        </>
      )}
    </>
  )
}
