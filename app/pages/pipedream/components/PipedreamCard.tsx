import { Avatar, Badge, Box, Button, Card, Group, Text, Title, useMantineColorScheme } from '@mantine/core'
import { RiArrowRightLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import { getInitials } from '~/lib/utils'
import { ConnectButton } from '~/shared/ConnectButton'

export default function PipedreamCard({ app }: any) {
  const { colorScheme } = useMantineColorScheme()
  const { getMemberApps } = usePipedreamStore()
  const [checkIsConnected, setCheckIsConnected] = useState([])
  const navigate = useNavigate()

  // Handle missing img_src for local database records
  const getImageSrc = () => {
    if (app?.imgSrc) {
      return app.imgSrc
    }
    return null
  }

  const imageSrc = getImageSrc()
  const hasImage = !!imageSrc
  useEffect(() => {
    const checkIsConnected = getMemberApps()?.data?.filter((memberApp) => memberApp.app.nameSlug === app.nameSlug)
    if (checkIsConnected.length > 0) {
      setCheckIsConnected(checkIsConnected)
    } else {
      setCheckIsConnected([])
    }
  }, [])

  return (
    <Card shadow="sm" padding="xs" radius="md">
      <Card.Section bg={colorScheme === 'dark' ? 'dark.5' : 'gray.1'} p="4">
        <Group align="center" gap="xs">
          <Avatar src={imageSrc} alt={app?.name} radius="md" size={40} color={hasImage ? undefined : 'blue'}>
            {!hasImage && getInitials(app?.name)}
          </Avatar>
          <Title order={6} lineClamp={1}>
            {app?.name}
          </Title>
        </Group>
      </Card.Section>
      <Card.Section p="xs">
        <Box h={50}>
          <Text size="sm" color="dimmed" fw={500} lineClamp={3}>
            {app?.description}
          </Text>
        </Box>
      </Card.Section>
      <Card.Section p="xs">
        <Badge variant="light">{Array.isArray(app?.categories) ? app?.categories.join(', ') : app?.categories || ''}</Badge>
      </Card.Section>
      <Card.Section p="xs">
        <Group justify="space-between">
          <ConnectButton size="xs" accountId={checkIsConnected[0]?.id} app={app} />
          <Box>
            <Button
              justify="space-between"
              w="100%"
              rightSection={<RiArrowRightLine size={16} />}
              variant="transparent"
              size="xs"
              onClick={() => navigate(`/account/pipedream/${app.nameSlug}`)}
            >
              View
            </Button>
          </Box>
        </Group>
      </Card.Section>
    </Card>
  )
}
