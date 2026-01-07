import { ActionIcon, Button, Card, Group, Modal, SimpleGrid, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiEditLine, RiMailLine, RiPhoneLine, RiUserLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'

interface UserProfile {
  id: number
  user_id: string
  first_name: string | null
  last_name: string | null
  bio: string | null
  api_key: string | null
  created_at: string
  updated_at: string
}

export default function ProfileInformation() {
  const [loading, setLoading] = useState(false)
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const { api, user, setUser } = useAiStore()

  const form = useForm({
    initialValues: {
      email: '',
      phone: '',
      first_name: '',
      last_name: '',
      bio: '',
    },
  })

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await api.from('user_profiles').select('*').eq('user_id', user.id).single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // If no profile exists, we'll create one when they save
        setUserProfile(null)
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUserProfile(null)
    }
  }

  useEffect(() => {
    if (user) {
      form.setValues({
        email: user.email || '',
        phone: user.phone || '',
        first_name: userProfile?.first_name || '',
        last_name: userProfile?.last_name || '',
        bio: userProfile?.bio || '',
      })
    }
  }, [user, userProfile])

  useEffect(() => {
    fetchUserProfile()
  }, [user?.id])

  const handleSave = async () => {
    const values = form.getValues()

    if (!values.email.trim()) {
      showNotification({ title: 'Error', message: 'Email is required', type: 'error' })
      return
    }

    try {
      setLoading(true)

      // Update auth user (email and phone)
      const { data: authData, error: authError } = await api.auth.updateUser({
        email: values.email,
        phone: values.phone || undefined,
      })

      if (authError) {
        showNotification({ title: 'Error', message: authError.message, type: 'error' })
        return
      }

      // Update or create user profile (first_name, last_name, bio)
      if (userProfile) {
        // Update existing profile
        const { error: profileError } = await api
          .from('user_profiles')
          .update({
            first_name: values.first_name,
            last_name: values.last_name,
            bio: values.bio,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userProfile.id)

        if (profileError) {
          showNotification({ title: 'Error', message: 'Failed to update profile information', type: 'error' })
          return
        }
      } else {
        // Create new profile
        const { error: profileError } = await api.from('user_profiles').insert({
          user_id: user.id,
          first_name: values.first_name,
          last_name: values.last_name,
          bio: values.bio,
        })

        if (profileError) {
          showNotification({ title: 'Error', message: 'Failed to create profile information', type: 'error' })
          return
        }
      }

      showNotification({ title: 'Success', message: 'Profile updated successfully', type: 'success' })
      setUser(authData.user)
      fetchUserProfile() // Refresh profile data
      closeModal()
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification({ title: 'Error', message: 'Failed to update profile', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Text size="lg" fw={600}>
            Profile Information
          </Text>
          <ActionIcon variant="light" color="blue" size="lg" onClick={openModal} title="Edit Profile">
            <RiEditLine size={16} />
          </ActionIcon>
        </Group>

        <Card padding="sm" radius="xs">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Stack gap="xs">
              <Group gap="xs">
                <RiMailLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  Email
                </Text>
              </Group>
              <Text>{user?.email}</Text>
            </Stack>

            <Stack gap="xs">
              <Group gap="xs">
                <RiPhoneLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  Phone
                </Text>
              </Group>
              <Text>{user?.phone || 'Not set'}</Text>
            </Stack>

            <Stack gap="xs">
              <Group gap="xs">
                <RiUserLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  First Name
                </Text>
              </Group>
              <Text>{userProfile?.first_name || 'Not set'}</Text>
            </Stack>

            <Stack gap="xs">
              <Group gap="xs">
                <RiUserLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  Last Name
                </Text>
              </Group>
              <Text>{userProfile?.last_name || 'Not set'}</Text>
            </Stack>

            <Stack gap="xs" style={{ gridColumn: '1 / -1' }}>
              <Group gap="xs">
                <RiUserLine size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" fw={500} c="dimmed">
                  Bio
                </Text>
              </Group>
              <Text>{userProfile?.bio || 'No bio added'}</Text>
            </Stack>
          </SimpleGrid>
        </Card>
      </Stack>

      {/* Edit Profile Modal */}
      <Modal opened={modalOpened} onClose={closeModal} title="Edit Profile" size="md">
        <FormProvider form={form}>
          <Stack gap="md">
            <TextInput label="Email" placeholder="Enter your email" required leftSection={<RiMailLine size={16} />} {...form.getInputProps('email')} />

            <TextInput label="Phone" placeholder="Enter your phone number" leftSection={<RiPhoneLine size={16} />} {...form.getInputProps('phone')} />

            <TextInput label="First Name" placeholder="Enter your first name" leftSection={<RiUserLine size={16} />} {...form.getInputProps('first_name')} />

            <TextInput label="Last Name" placeholder="Enter your last name" leftSection={<RiUserLine size={16} />} {...form.getInputProps('last_name')} />

            <Textarea label="Bio" placeholder="Tell us about yourself" rows={3} {...form.getInputProps('bio')} />

            <Group justify="flex-end" gap="md">
              <Button variant="light" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={loading}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </FormProvider>
      </Modal>
    </>
  )
}

export { useDisclosure }
