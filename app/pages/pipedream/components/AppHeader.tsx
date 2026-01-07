import { Avatar, Badge, Button, Group, Stack, Text, Title } from '@mantine/core'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import { getInitials } from '~/lib/utils'
import { ConnectButton } from '~/shared/ConnectButton'

interface AppHeaderProps {
  onNavigate: (path: string) => void
}

export function AppHeader({ onNavigate }: AppHeaderProps) {
  const { getSelectedAccount, isConnected, selectedApp } = usePipedreamStore()
  return (
    <Stack gap="lg">
      <Group>
        <Button variant="default" size="xs" onClick={() => onNavigate('/account/pipedream')}>
          Connected Apps
        </Button>
        <Button variant="default" size="xs" onClick={() => onNavigate('/account/pipedream/connect')}>
          Connect App
        </Button>
      </Group>
      <Group justify="space-between">
        <Group align="center" gap="xs">
          <Avatar src={selectedApp?.imgSrc} alt={selectedApp?.name} radius="md" size={40} color={selectedApp?.imgSrc ? undefined : 'blue'}>
            {!selectedApp?.imgSrc && getInitials(selectedApp?.name)}
          </Avatar>
          <Title order={2}>{selectedApp?.name}</Title>
        </Group>
        <ConnectButton accountId={getSelectedAccount()?.id} app={selectedApp} />
      </Group>
      <Group align="center" gap="xs">
        <Badge variant="light">{Array.isArray(selectedApp?.categories) ? selectedApp?.categories.join(', ') : selectedApp?.categories || ''}</Badge>
        {isConnected && <Badge color="green">Connected</Badge>}
      </Group>
      <Text>{selectedApp?.description}</Text>
    </Stack>
  )
}
