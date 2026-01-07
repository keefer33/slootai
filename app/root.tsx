import { MantineProvider } from '@mantine/core'
import mantine from '@mantine/core/styles.css?url'
import notifications from '@mantine/notifications/styles.css?url'
import { useEffect } from 'react'
import { isRouteErrorResponse, Links, Meta, Outlet, redirect, Scripts, ScrollRestoration } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import { useAuth } from './lib/hooks/useAuth'
import { createThemeWithColor } from './lib/theme'
import NotFound from './pages/root/404'
import PageLoader from './shared/PageLoader'
import themecss from './styles/theme.css?url'
import { getClient } from './lib/supaServerClient'

// Dynamic theme provider component
function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeColor, setThemeColor } = useAiStore()

  // Load theme settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('themeSettings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        if (settings.themeColor && settings.themeColor !== themeColor) {
          setThemeColor(settings.themeColor)
        }
      } catch (error) {
        console.error('Error loading theme settings:', error)
      }
    }
  }, [])

  const dynamicTheme = createThemeWithColor(themeColor)

  return (
    <MantineProvider theme={dynamicTheme} defaultColorScheme="dark">
      {children}
    </MantineProvider>
  )
}

export const links = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Lilita+One&display=swap',
  },
  {
    rel: 'preconnect',
    href: 'https://accounts.google.com/gsi/client',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { appLoading } = useAiStore()
  useAuth()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={mantine} />
        <link rel="stylesheet" href={notifications} />
        <link rel="stylesheet" href={themecss} />
        <script src="https://accounts.google.com/gsi/client" async></script>
        <Meta />
        <Links />
      </head>
      <body>
        <DynamicThemeProvider>{appLoading ? <PageLoader /> : children}</DynamicThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }) {
  console.error('ErrorBoundary caught error:', error)
  let message = '500'
  let details = 'Internal Server Error'
  let stack: string | undefined
  let errorType = 'unknown'
  let componentInfo = ''

  if (isRouteErrorResponse(error)) {
    // Handle route errors (404, 500, etc.)
    console.error('Route error:', error)
    errorType = 'route'
    message = error.status === 404 ? '404' : `Error ${error.status}`
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  } else if (error && error instanceof Error) {
    // Handle JavaScript/React errors - default to 500
    errorType = 'component'
    message = '500'
    details = 'Internal Server Error'

    // Extract component information from error stack if available
    if (error.stack) {
      const stackLines = error.stack.split('\n')
      const componentLine = stackLines.find((line) => line.includes('.tsx') || line.includes('.jsx'))
      if (componentLine) {
        componentInfo = componentLine.trim()
      }
    }

    // Provide more specific error details based on error type
    if (error.message.includes('Cannot read properties of undefined')) {
      details = 'A component tried to access properties of an undefined object. This usually means data is not loaded yet or a prop is missing.'
    } else if (error.message.includes('map')) {
      details = 'A component tried to iterate over undefined data. This usually means an array prop is missing or not loaded yet.'
    } else if (error.message.includes('Cannot read properties of null')) {
      details = 'A component tried to access properties of a null object. This usually means data is null when it should have a value.'
    } else {
      details = error.message
    }

    stack = error.stack
  } else if (typeof error === 'string') {
    // Handle string errors - default to 500
    errorType = 'string'
    message = '500'
    details = error
  } else if (error && typeof error === 'object') {
    // Handle object errors - default to 500
    errorType = 'object'
    message = '500'
    details = error.message || 'An object error occurred'
    stack = error.stack
  }

  // Log error details for debugging
  console.error('ErrorBoundary caught error:', {
    errorType,
    message,
    details,
    componentInfo,
    originalError: error,
    stack,
  })

  return <NotFound message={message} details={details} stack={stack} errorType={errorType} componentInfo={componentInfo} />
}
