import { ScrollArea, Stack, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import Mounted from '~/shared/Mounted'
import { AppHeader } from './components/AppHeader'
import { AvailableComponents } from './components/AvailableComponents'
import { LoadedTool } from './components/LoadedTool'

export default function PipedreamApp() {
  const appSlug = useParams().appSlug
  const { selectedApp, selectedAccount, isConnected, selectedComponent, setSelectedComponent, reset, init, getAccountList, getAppBySlug } = usePipedreamStore()
  const { pageLoading, setPageLoading } = useAiStore()
  const navigate = useNavigate()
  const { user, getAuthToken } = useAiStore()

  // Use Mantine's useMediaQuery hook for responsive behavior
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  const runInit = async () => {
    await getAccountList(user.id, getAuthToken())
    await getAppBySlug(appSlug, getAuthToken())
    init(appSlug)
    setPageLoading(false)
  }

  // Load tools and filter created Pipedream tools
  useEffect(() => {
    if (appSlug) {
      reset()
      setPageLoading(true)
      runInit()
    }
  }, [appSlug])

  return (
    <Mounted pageLoading={pageLoading} size="lg">
      {selectedApp && <AppHeader onNavigate={handleNavigate} />}

      {isMobile ? (
        // Mobile: Stack columns vertically without scrolling
        <Stack gap="lg" mt="lg">
          <AvailableComponents selectedApp={selectedApp} selectedComponent={selectedComponent} setSelectedComponent={setSelectedComponent} isMobile={isMobile} />
          <LoadedTool selectedApp={selectedApp} selectedComponent={selectedComponent} isConnected={isConnected} selectedAccount={selectedAccount} isMobile={isMobile} />
        </Stack>
      ) : (
        // Desktop: 2-column layout with independent scrolling
        <div style={{ display: 'flex', gap: 'var(--mantine-spacing-lg)', marginTop: 'var(--mantine-spacing-lg)', height: 'calc(100vh - 330px)' }}>
          <ScrollArea style={{ width: '25%', height: '100%' }}>
            <AvailableComponents selectedApp={selectedApp} selectedComponent={selectedComponent} setSelectedComponent={setSelectedComponent} isMobile={isMobile} />
          </ScrollArea>
          <ScrollArea style={{ width: '75%', height: '100%' }}>
            <LoadedTool selectedApp={selectedApp} selectedComponent={selectedComponent} isConnected={isConnected} selectedAccount={selectedAccount} isMobile={isMobile} />
          </ScrollArea>
        </div>
      )}
    </Mounted>
  )
}
