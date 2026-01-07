import { AppShell, Box, Burger, Group, ScrollArea, Stack, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet } from 'react-router'
import Logo from './Logo'
import { Navbar } from './Navbar'
import { UserMenu } from './UserMenu'

export default function AccountLayout() {
  const { colorScheme } = useMantineColorScheme()
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()

  return (
    <AppShell
      layout="alt"
      header={{ height: 60 }}
      navbar={{
        width: 200,
        breakpoint: 'md',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="0"
      withBorder={false}
    >
      <AppShell.Header>
        <Group h="100%" p="sm" justify="space-between">
          <Group>
            <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" hiddenFrom="sm" />
            <Box hiddenFrom="sm">
              <Logo />
            </Box>
          </Group>
          <Group gap="xs">
            <UserMenu />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="0" bg={colorScheme === 'dark' ? 'dark.6' : 'gray.1'}>
        <AppShell.Section>
          <Group justify="end" p="xs">
            <Burger opened={mobileOpened} onClick={toggleMobile} size="sm" hiddenFrom="sm" />
          </Group>
          <Stack gap="0" py="md" px="xs">
            <Logo />
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
  )
}
