import { Button, Group } from '@mantine/core'
import { RiAddLine } from '@remixicon/react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import PipedreamAppList from './components/PipedreamAppList'

// Module-level flag to prevent duplicate calls across component instances
let isInitializing = false

export default function PipedreamConnect() {
  const { setPageLoading, pageLoading } = useAiStore()
  const { getAccountList, getPipedreamApps, getMemberApps } = usePipedreamStore()
  const navigate = useNavigate()
  const { user, getAuthToken } = useAiStore()
  const initRef = useRef(false)
  const memberAppsRef = useRef<any>(null)

  useEffect(() => {
    // Prevent double initialization within the same component instance
    if (initRef.current) return

    // Prevent duplicate calls across different component instances (StrictMode)
    if (isInitializing) return

    initRef.current = true
    isInitializing = true

    setPageLoading(true)

    const init = async () => {
      try {
        // Cache member apps check to avoid multiple getter calls
        if (!memberAppsRef.current) {
          memberAppsRef.current = getMemberApps()
        }
        const hasExistingData = memberAppsRef.current?.data && memberAppsRef.current.data.length > 0

        await getPipedreamApps('', getAuthToken())

        // Only call getAccountList if we don't already have the data
        if (!hasExistingData) {
          await getAccountList(user.id, getAuthToken())
          // Update the ref after fetching
          memberAppsRef.current = getMemberApps()
        }

        setPageLoading(false)
      } catch {
        setPageLoading(false)
      } finally {
        isInitializing = false
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
