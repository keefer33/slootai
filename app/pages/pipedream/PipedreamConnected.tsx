import { Box, Button, Grid, Group } from '@mantine/core'
import { RiAddLine } from '@remixicon/react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import PipedreamCard from './components/PipedreamCard'

// Module-level flag to prevent duplicate calls across component instances
let isInitializingConnected = false

export default function PipedreamConnected() {
  const navigate = useNavigate()
  const { setPageLoading, pageLoading } = useAiStore()
  const { getMemberApps, getAccountList } = usePipedreamStore()
  const { user, getAuthToken } = useAiStore()
  const initRef = useRef(false)

  useEffect(() => {
    // Prevent double initialization within the same component instance
    if (initRef.current) return

    // Prevent duplicate calls across different component instances (StrictMode)
    if (isInitializingConnected) return

    initRef.current = true
    isInitializingConnected = true

    setPageLoading(true)

    const init = async () => {
      try {
        // Check if member apps are already loaded to avoid duplicate getAccountList call
        const existingMemberApps = getMemberApps()
        const hasExistingData = existingMemberApps?.data && existingMemberApps.data.length > 0

        // Only call getAccountList if we don't already have the data
        if (!hasExistingData) {
          await getAccountList(user.id, getAuthToken())
        }

        setPageLoading(false)
      } catch {
        setPageLoading(false)
      } finally {
        isInitializingConnected = false
      }
    }

    init()

    // Cleanup function
    return () => {
      initRef.current = false
    }
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
