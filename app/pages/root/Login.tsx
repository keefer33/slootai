import { Button, Center, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { useState } from 'react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'

export default function Login() {
  const { api } = useAiStore()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const values = form.getValues()

      // Insert email into email_invites table
      const { error } = await api.from('email_invites').insert({
        email: values.email,
        status: 'pending',
      })

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          showNotification({
            title: 'Already on the list!',
            message: 'This email is already on our invite list.',
            type: 'info',
          })
        } else {
          throw error
        }
      } else {
        setSubmitted(true)
        showNotification({
          title: 'Success!',
          message: "You've been added to our invite list. We'll notify you when we launch!",
          type: 'success',
        })
      }
    } catch (error) {
      console.error('Error adding email to invite list:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to add email to invite list. Please try again.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Center h="100vh">
      <Notifications />
      <Paper radius="lg" p="xl" w={400}>
        <Stack gap="lg" align="center">
          <div style={{ textAlign: 'center' }}>
            <Title order={1} size="h1" mb="md">
              Coming Soon
            </Title>
            <Text size="lg" c="dimmed" mb="lg">
              We&apos;re building something amazing! SlootAI is the complete AI agent platform that will revolutionize how you work with AI.
            </Text>
          </div>

          {submitted ? (
            <Stack gap="md" align="center">
              <Text size="lg" fw={600} c="green">
                🎉 You&apos;re on the list!
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                We&apos;ll notify you as soon as we launch. Get ready for the future of AI agents!
              </Text>
            </Stack>
          ) : (
            <FormProvider form={form}>
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Stack gap="lg">
                  <Text size="sm" c="dimmed" ta="center">
                    Be the first to know when we launch. Join our invite list!
                  </Text>

                  <TextInput label="Email Address" placeholder="you@example.com" type="email" required {...form.getInputProps('email')} key={form.key('email')} size="md" />

                  <Button type="submit" fullWidth size="md" loading={loading} disabled={loading}>
                    {loading ? 'Adding to list...' : 'Join the Waitlist'}
                  </Button>
                </Stack>
              </form>
            </FormProvider>
          )}

          <Stack gap="xs" mt="lg" align="center">
            <Text size="sm" c="dimmed" ta="center">
              What you&apos;ll get with SlootAI:
            </Text>
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed">
                • Build AI agents with multiple models
              </Text>
              <Text size="xs" c="dimmed">
                • Connect to 2,500+ APIs via Pipedream
              </Text>
              <Text size="xs" c="dimmed">
                • Create custom tools and MCP servers
              </Text>
              <Text size="xs" c="dimmed">
                • Advanced file management and security
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Center>
  )
}
