import { Button, Center, Paper, Stack, TextInput, Title } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { FormProvider, useForm } from '~/lib/ContextForm'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'

// Declare Google types
declare global {
  interface Window {
    google: any
    handleSignInWithGoogle: (response: any) => void
  }
}

export default function Invite() {
  const { api, setUser, generateAndUpdateApiKey } = useAiStore()
  const [otp, setOtp] = useState(true)
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const navigate = useNavigate()
  const googleButtonRef = useRef<HTMLDivElement>(null)

  // Generate nonce for security
  const [nonce, setNonce] = useState<string>('')
  const [hashedNonce, setHashedNonce] = useState<string>('')

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      otp: '',
    },
  })

  // Generate nonce and hashed nonce
  const generateNonce = async () => {
    const nonceValue = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    const encoder = new TextEncoder()
    const encodedNonce = encoder.encode(nonceValue)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedNonceValue = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    setNonce(nonceValue)
    setHashedNonce(hashedNonceValue)
  }

  // Handle user login and API key generation
  const handleUserLogin = async (user: any, sessionData: any) => {
    setUser(user)

    // Check if user has an API key in user_profiles table
    try {
      const { data: userProfile, error: profileError } = await api.from('user_profiles').select('api_key').eq('user_id', user.id).single()
      if (profileError || !userProfile?.api_key) {
        // No API key found, generate one
        await generateAndUpdateApiKey(true, sessionData, null)
      }
    } catch (error) {
      console.error('Error checking/generating API key:', error)
      // Continue with login even if API key generation fails
    }

    navigate('/account/profile')
  }

  const supalogin = async () => {
    await api.auth.signInWithOtp({
      email: form.getValues().email,
      options: {
        // set this to false if you do not want the user to be automatically signed up
        shouldCreateUser: true,
      },
    })
    setOtp(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp) {
      await supalogin()
    } else {
      await supaOtp()
    }
  }

  const supaOtp = async () => {
    const values = form.getValues()
    const {
      data: { session },
    } = await api.auth.verifyOtp({
      email: values.email,
      token: values.otp,
      type: 'email',
    })
    if (session) {
      await handleUserLogin(session.user, session)
    } else {
      showNotification({
        title: 'Error',
        message: 'Invalid OTP',
        type: 'error',
      })
    }
  }

  // Generate nonce on component mount
  useEffect(() => {
    generateNonce()
  }, [])

  // Set up Google Sign-In callback
  useEffect(() => {
    // Set up global callback function
    window.handleSignInWithGoogle = async (response: any) => {
      console.log('Google Sign-In response:', response)

      try {
        const { data, error } = await api.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          nonce: nonce,
        })

        if (error) {
          console.error('Error signing in with Google:', error)
          showNotification({
            title: 'Error',
            message: error.message,
            type: 'error',
          })
          return
        }

        if (data?.user) {
          await handleUserLogin(data.user, data)
        }
      } catch (error) {
        console.error('Unexpected error during Google Sign-In:', error)
        showNotification({
          title: 'Error',
          message: 'An unexpected error occurred during sign-in',
          type: 'error',
        })
      }
    }

    // Cleanup function to remove global callback
    return () => {
      delete window.handleSignInWithGoogle
    }
  }, [api, setUser, generateAndUpdateApiKey, navigate, nonce])

  // Check if Google script is loaded and initialize
  useEffect(() => {
    if (!nonce || !hashedNonce) return

    const checkGoogleLoaded = () => {
      console.log('Checking if Google script is loaded...', { google: !!window.google, accounts: !!(window.google && window.google.accounts) })
      if (window.google && window.google.accounts) {
        console.log('Google script loaded, initializing...')
        setGoogleLoaded(true)
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: '453624149585-6b4suitj2nqcq3rioh9ctrl3r02lkclj.apps.googleusercontent.com',
          callback: window.handleSignInWithGoogle,
          nonce: hashedNonce,
          auto_select: true,
          itp_support: true,
          use_fedcm_for_prompt: true,
        })
      } else {
        // Retry after a short delay
        setTimeout(checkGoogleLoaded, 100)
      }
    }

    // Start checking for Google script
    checkGoogleLoaded()
  }, [nonce, hashedNonce])

  // Render the button when Google is loaded and ref is available
  useEffect(() => {
    if (googleLoaded && googleButtonRef.current && window.google && window.google.accounts) {
      console.log('Rendering Google Sign-In button...')
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        shape: 'pill',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        logo_alignment: 'left',
      })
      console.log('Google Sign-In button rendered')
    }
  }, [googleLoaded])

  return (
    <Center h="100vh">
      <Notifications />
      <Paper radius="lg" p="xl" w={350}>
        <Stack gap="lg">
          <div style={{ textAlign: 'center' }}>
            <Title order={2}>Welcome</Title>
          </div>
          {googleLoaded ? <div ref={googleButtonRef}></div> : <div style={{ textAlign: 'center', padding: '20px' }}>Loading Google Sign-In...</div>}

          <FormProvider form={form}>
            <form onSubmit={handleSubmit}>
              <Stack gap="lg">
                {!otp && (
                  <Stack gap="lg">
                    <TextInput label="OTP" placeholder="" type="text" required {...form.getInputProps('otp')} key={form.key('otp')} />
                    <Button type="submit">Enter One Time Password</Button>
                    <Button onClick={() => setOtp(true)}>Resend</Button>
                  </Stack>
                )}
                {otp && (
                  <Stack gap="lg">
                    <TextInput label="Email Address" placeholder="you@example.com" type="email" required {...form.getInputProps('email')} key={form.key('email')} />
                    <Button type="submit">Send One Time Password to Email</Button>
                  </Stack>
                )}
              </Stack>
            </form>
          </FormProvider>
        </Stack>
      </Paper>
    </Center>
  )
}
