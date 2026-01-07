import { ActionIcon, Avatar, Group, Menu } from '@mantine/core'
import { RiKeyFill, RiLoginBoxLine, RiLogoutBoxLine, RiMoneyDollarBoxLine, RiUserLine } from '@remixicon/react'
import { Link } from 'react-router'
import { useAuth } from '~/lib/hooks/useAuth'
import { useTheme } from '~/lib/hooks/useTheme'
import useAiStore from '~/lib/store/aiStore'
import ColorPicker from './ColorPicker'
import ThemeToggle from './ThemeToggle'

export function UserMenu() {
  const { user } = useAiStore()
  const { signOut } = useAuth()
  const { colorScheme, themeColor, toggleColorScheme, changeThemeColor } = useTheme()

  return (
    <Group gap="0">
      <ThemeToggle colorScheme={colorScheme} onToggle={toggleColorScheme} />

      <ColorPicker selectedColor={themeColor} onColorChange={changeThemeColor} size="sm" />

      {user?.id ? (
        <Menu shadow="md" position="bottom-end" offset={15} withArrow arrowPosition="center">
          <Menu.Target>
            <ActionIcon variant="transparent" size="lg">
              <Avatar radius="xl" />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown w="150px">
            <Menu.Item component={Link} to="/account/profile" leftSection={<RiUserLine size={16} />}>
              Profile
            </Menu.Item>
            <Menu.Item component={Link} to="/account/billing" leftSection={<RiMoneyDollarBoxLine size={16} />}>
              Billing
            </Menu.Item>
            <Menu.Item component={Link} to="/account/apikeys" leftSection={<RiKeyFill size={16} />}>
              API Keys
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item component={Link} to="/login" color="red.5" onClick={signOut} leftSection={<RiLogoutBoxLine size={16} />}>
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <ActionIcon component={Link} to="/login" variant="transparent" size="lg" aria-label="Sign in">
          <RiLoginBoxLine />
        </ActionIcon>
      )}
    </Group>
  )
}
