import { Avatar, Badge, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { useEffect, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import { getInitials } from '~/lib/utils'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import AccountInformation from './components/AccountInformation'
import ProfileInformation from './components/ProfileInformation'
import ThemeSettings from './components/ThemeSettings'

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

export default function UserProfile() {
  const theme = useMantineTheme()
  const { user, pageLoading, api } = useAiStore()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const getProviderBadge = () => {
    const provider = user?.app_metadata?.provider
    if (provider === 'email') return { label: 'Email', color: 'blue' }
    return { label: provider || 'Unknown', color: 'gray' }
  }

  const providerBadge = getProviderBadge()

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await api.from('user_profiles').select('*').eq('user_id', user.id).single()

        if (!error && data) {
          setUserProfile(data)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [user?.id, api])

  const getDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    }
    return user?.email || 'User'
  }

  return (
    <Mounted pageLoading={pageLoading}>
      <PageTitle title="User Profile" />

      <Stack gap="xl">
        {/* Header Section */}
        <Group justify="space-between" align="flex-start">
          <Group gap="lg">
            <Avatar size={80} radius={80} src={user?.user_metadata?.avatar_url} color={theme.primaryColor}>
              {getInitials(user?.email || '')}
            </Avatar>
            <Stack gap="xs">
              <Text size="xl" fw={700}>
                {getDisplayName()}
              </Text>
              <Group gap="xs">
                <Badge color={providerBadge.color} variant="light">
                  {providerBadge.label}
                </Badge>
                {user?.email_confirmed_at && (
                  <Badge color="green" variant="light">
                    Verified
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>
        </Group>

        {/* Profile Information */}
        <ProfileInformation />

        {/* Account Information */}
        <AccountInformation />

        {/* Theme Settings */}
        <ThemeSettings />
      </Stack>
    </Mounted>
  )
}
