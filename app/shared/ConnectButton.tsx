import { Button, Center, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiPlug2Line } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'

interface ConnectButtonProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'filled' | 'light' | 'outline' | 'subtle' | 'default'
  showLoginButton?: boolean
  loginButtonText?: string
  connectButtonText?: string
  connectedButtonText?: string
  accountId?: string
  connectButtonColor?: string
  connectedButtonColor?: string
  app?: any
}

export function ConnectButton({
  size = 'xs',
  variant = 'default',
  showLoginButton = true,
  loginButtonText = 'Please login to connect this Pipedream Server',
  connectButtonText = 'Connect',
  connectedButtonText = 'Connected',
  accountId,
  connectButtonColor = 'green',
  connectedButtonColor = 'green',
  app,
}: ConnectButtonProps) {
  const { user, getAuthToken } = useAiStore()
  const { connectAccount, deleteAccount, setSelectedApp, getMemberApps } = usePipedreamStore()
  const [opened, { open, close }] = useDisclosure(false)
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = async () => {
    if (user?.id) {
      setSelectedApp(app)
      connectAccount(user.id, checkButtonState, getAuthToken())
    }
  }

  const checkButtonState = () => {
    const getPipedreamApp = getMemberApps()?.data?.find((apps) => apps.app.nameSlug === app.nameSlug)
    if (getPipedreamApp) {
      setIsConnected(true)
    } else {
      setIsConnected(false)
    }
  }

  const handleDisconnect = () => {
    if (accountId) {
      deleteAccount(accountId, user.id, checkButtonState, getAuthToken())
      close()
    }
  }

  const handleDisconnectClick = () => {
    open()
  }

  useEffect(() => {
    checkButtonState()
  }, [getMemberApps()])

  if (!user?.id) {
    if (!showLoginButton) return null

    return (
      <Center p="md">
        <Button size={size} component={Link} to="/login">
          {loginButtonText}
        </Button>
      </Center>
    )
  }

  if (isConnected) {
    return (
      <>
        <Button size={size} variant="outline" color={connectedButtonColor} onClick={handleDisconnectClick} rightSection={<RiPlug2Line size={16} />}>
          {connectedButtonText}
        </Button>

        <Modal opened={opened} onClose={close} title="Confirm Disconnection" centered>
          <p>Are you sure you want to disconnect this app? This action cannot be undone.</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </Modal>
      </>
    )
  }

  return (
    <Button size={size} variant={variant} color={connectButtonColor} onClick={handleConnect} rightSection={<RiPlug2Line size={16} />}>
      {connectButtonText}
    </Button>
  )
}
