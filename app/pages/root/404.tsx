import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { RiArrowLeftLine, RiHomeLine, RiSearchLine } from '@remixicon/react'
import { Link, useNavigate } from 'react-router'

interface NotFoundProps {
  message?: string
  details?: string
  stack?: string
  errorType?: string
  componentInfo?: string
}

export default function NotFound({ message = '500', details = 'Internal Server Error', stack, errorType, componentInfo }: NotFoundProps) {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl" align="center" ta="center">
        {/* Error Icon/Number */}
        <Stack gap="md" align="center">
          <Title order={1} size="120" c="dimmed" style={{ fontFamily: 'monospace', fontWeight: 200 }}>
            {message}
          </Title>
          <Title order={2} size="h3" c="dimmed">
            {details}
          </Title>
        </Stack>

        {/* Main Message */}
        <Stack gap="md">
          <Text size="lg" c="dimmed">
            {message === '404' ? "Oops! The page you're looking for doesn't exist." : 'An unexpected error occurred.'}
          </Text>
          <Text size="md" c="dimmed">
            {message === '404' ? 'It might have been moved, deleted, or you entered the wrong URL.' : 'Please try again or contact support if the problem persists.'}
          </Text>
        </Stack>

        {/* Action Buttons */}
        <Group gap="md">
          <Button leftSection={<RiArrowLeftLine size={16} />} onClick={handleGoBack} variant="light" size="md">
            Go Back
          </Button>
          <Button leftSection={<RiHomeLine size={16} />} onClick={handleGoHome} variant="filled" size="md">
            Go Home
          </Button>
        </Group>

        {/* Quick Links */}
        <Stack gap="sm">
          <Text size="sm" fw={500} c="dimmed">
            Quick Navigation
          </Text>
          <Group gap="md" justify="center">
            <Button component={Link} to="/login" variant="subtle" size="sm" leftSection={<RiSearchLine size={14} />}>
              Login
            </Button>
            <Button component={Link} to="/account/tools" variant="subtle" size="sm" leftSection={<RiSearchLine size={14} />}>
              Tools
            </Button>
            <Button component={Link} to="/account/agents" variant="subtle" size="sm" leftSection={<RiSearchLine size={14} />}>
              Agents
            </Button>
          </Group>
        </Stack>

        {/* Additional Information */}
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            If you believe this is an error, please contact support.
          </Text>
          <Text size="xs" c="dimmed">
            Error Code: {message === '404' ? '404_NOT_FOUND' : '500_INTERNAL_SERVER_ERROR'}
          </Text>
          {errorType && errorType !== 'route' && (
            <Text size="xs" c="dimmed">
              Error Type: {errorType.toUpperCase()}
            </Text>
          )}
          {componentInfo && (
            <Text size="xs" c="dimmed">
              Component: {componentInfo}
            </Text>
          )}
        </Stack>

        {/* Stack Trace for Development */}
        {stack && import.meta.env.DEV && (
          <Stack gap="sm" w="100%">
            <Text size="sm" fw={500} c="dimmed">
              Stack Trace (Development Only)
            </Text>
            <pre style={{ fontSize: '12px', fontFamily: 'monospace', overflow: 'auto', maxHeight: '200px' }}>
              <code>{stack}</code>
            </pre>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
