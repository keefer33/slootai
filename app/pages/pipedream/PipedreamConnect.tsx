import { Button, Group } from '@mantine/core'
import { RiAddLine } from '@remixicon/react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import PipedreamAppList from './components/PipedreamAppList'

export default function PipedreamConnect() {
  const { setPageLoading, pageLoading } = useAiStore()
  const { getAccountList, getPipedreamApps } = usePipedreamStore()
  const navigate = useNavigate()
  const { user, getAuthToken } = useAiStore()

  const init = async () => {
    await getPipedreamApps('', getAuthToken())
    await getAccountList(user.user_id, getAuthToken())
    setPageLoading(false)
  }

  useEffect(() => {
    setPageLoading(true)
    init()
  }, [])

  return (
    <Mounted pageLoading={pageLoading}>
      <PageTitle title="Pipedream Connect" text="Add 2,500+ APIs and 10,000+ tools to your AI Agents. Connect your accounts securely and revoke access at any time." />
      <Group justify="flex-end" mb="md">
        <Button variant="light" leftSection={<RiAddLine size={16} />} onClick={() => navigate('/account/pipedream')}>
          Connected Apps
        </Button>
      </Group>
      <PipedreamAppList />
    </Mounted>
  )
}
