import { Alert, Box, Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { RiErrorWarningLine, RiRefreshLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import useAiStore from '~/lib/store/aiStore'

export default function ApiOffline() {
  console.log('ApiOffline component rendering...')
  const { healthCheck } = useAiStore()
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null)

  const handleRetry = async () => {
    console.log('Retry button clicked')
    setIsChecking(true)
    try {
      const response = await healthCheck()
      console.log('Retry response:', response)
      if (response?.success === true) {
        // API is back up, redirect back to where they came from or home
        const redirectedFrom = sessionStorage.getItem('redirectedFrom')
        const targetLocation = redirectedFrom && redirectedFrom !== '/api-offline' ? redirectedFrom : '/'

        console.log('API is back up, redirecting to:', targetLocation)

        // Clear the stored location
        sessionStorage.removeItem('redirectedFrom')

        // Navigate back to the original location
        navigate(targetLocation)
      } else {
        // Still down, update last check time
        console.log('API still down, updating check time')
        setLastCheckTime(new Date())
      }
    } catch (error) {
      console.error('Health check failed:', error)
      setLastCheckTime(new Date())
    } finally {
      setIsChecking(false)
    }
  }

  const handleGoHome = () => {
    console.log('Go home button clicked')
    navigate('/')
  }

  useEffect(() => {
    console.log('ApiOffline useEffect running')
    // Set initial check time
    setLastCheckTime(new Date())
  }, [])

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl" align="center" ta="center">
        {/* Error Icon */}
        <Box>
          <RiErrorWarningLine size={80} color="var(--mantine-color-red-6)" />
        </Box>

        {/* Main Message */}
        <Stack gap="md">
          <Title order={1} size="h2" c="red.6">
            API Service Unavailable
          </Title>
          <Text size="lg" c="dimmed">
            We&apos;re experiencing technical difficulties with our external API service.
          </Text>
          <Text size="md" c="dimmed">
            Our team has been notified and is working to resolve the issue.
          </Text>
        </Stack>

        {/* Status Information */}
        <Alert icon={<RiErrorWarningLine size={16} />} title="Service Status" color="red" variant="light" w="100%">
          <Stack gap="xs">
            <Text size="sm">
              External API:{' '}
              <Text span fw={600} c="red">
                Offline
              </Text>
            </Text>
            {lastCheckTime && (
              <Text size="xs" c="dimmed">
                Last checked: {lastCheckTime.toLocaleTimeString()}
              </Text>
            )}
          </Stack>
        </Alert>

        {/* Action Buttons */}
        <Group gap="md">
          <Button leftSection={<RiRefreshLine size={16} />} onClick={handleRetry} loading={isChecking} variant="filled" size="md">
            {isChecking ? 'Checking...' : 'Check Again'}
          </Button>
          <Button onClick={handleGoHome} variant="light" size="md">
            Try Going Home
          </Button>
        </Group>

        {/* Additional Information */}
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            If this problem persists, please try again later or contact support.
          </Text>
          <Text size="xs" c="dimmed">
            Error Code: EXTERNAL_API_OFFLINE
          </Text>
        </Stack>
      </Stack>
    </Container>
  )
}
