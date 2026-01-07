import { Box, Button, Grid, Group } from '@mantine/core'
import { RiAddLine } from '@remixicon/react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import PipedreamCard from './components/PipedreamCard'

export default function PipedreamConnected() {
  const navigate = useNavigate()
  const { setPageLoading, pageLoading } = useAiStore()
  const { getMemberApps, getAccountList } = usePipedreamStore()
  const { user, getAuthToken } = useAiStore()

  const init = async () => {
    await getAccountList(user.user_id, getAuthToken())
    //setMemberApps(memberApps)
    setPageLoading(false)
  }

  useEffect(() => {
    setPageLoading(true)
    init()
  }, [])

  return (
    <Mounted pageLoading={pageLoading}>
      <PageTitle title="Pipedream Connected Apps" text="Add 2,500+ APIs and 10,000+ tools to your AI Agents. Connect your accounts securely and revoke access at any time." />
      <Group justify="flex-end" mb="md">
        <Button variant="light" leftSection={<RiAddLine size={16} />} onClick={() => navigate('/account/pipedream/connect')}>
          Connect App
        </Button>
      </Group>
      <Grid gutter="md">
        {getMemberApps()?.data?.map((app, i) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={`${i}-${app.app.name}`}>
            <Box>
              <PipedreamCard app={app.app} />
            </Box>
          </Grid.Col>
        ))}
      </Grid>
    </Mounted>
  )
}
