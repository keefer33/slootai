import { Container } from '@mantine/core'
import { useMounted } from '@mantine/hooks'
import PageLoader from './PageLoader'

interface MountedProps {
  children: React.ReactNode
  pageLoading?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export default function Mounted({ children, pageLoading, size = 'md' }: MountedProps) {
  const mounted = useMounted()

  return (
    <Container size={size === 'full' ? undefined : size} pb="lg" fluid={size === 'full'}>
      {mounted && !pageLoading ? children : <PageLoader />}
    </Container>
  )
}
