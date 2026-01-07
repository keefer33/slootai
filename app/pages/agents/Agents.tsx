import { Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useEffect } from 'react'
import { useLoaderData } from 'react-router'
import useAgentsUtils from '~/lib/hooks/useAgentsUtils'
import useAiStore from '~/lib/store/aiStore'
import { getClient } from '~/lib/supaServerClient'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import AgentCard from './components/AgentCard'
import AgentCreateNew from './components/AgentCreateNew'
import type { UserModel } from './types'

export async function loader({ request }) {
  try {
    const { supabase } = await getClient(request)

    // Get user models from database with brand information
    const { data: userModels, error } = await supabase.from('user_models').select('*, model:models(*, brand:brands(slug, name))').order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading user models:', error)
      return { userModels: [] }
    }

    // Transform the data to populate brand field with slug
    const transformedUserModels = (userModels || []).map((model) => ({
      ...model,
      brand: model.model?.brand?.slug || null,
    }))

    return { userModels: transformedUserModels }
  } catch (error) {
    console.error('Agents loader error:', error)
    return { userModels: [] }
  }
}

export default function Agents() {
  const { userModels, setUserModels } = useAiStore()
  const { resetAgent } = useAgentsUtils()
  const loaderData = useLoaderData<typeof loader>()

  useEffect(() => {
    resetAgent()
    // Set user models from loader data
    setUserModels(loaderData?.userModels || [])
  }, [])

  // Sort and group userModels by brand and model
  const sortedAndGroupedModels = (userModels || []).reduce(
    (acc, model: UserModel) => {
      const brand = model.model?.brand?.name || model.brand || 'Unknown'
      const modelName = model.model?.model || 'Unknown Model'

      if (!acc[brand]) {
        acc[brand] = {}
      }
      if (!acc[brand][modelName]) {
        acc[brand][modelName] = []
      }
      acc[brand][modelName].push(model)
      return acc
    },
    {} as Record<string, Record<string, UserModel[]>>,
  )

  // Sort brands alphabetically
  const sortedBrands = Object.keys(sortedAndGroupedModels).sort()

  const renderBrandSection = (brand: string) => {
    const brandModels = sortedAndGroupedModels[brand]
    const sortedModelNames = Object.keys(brandModels).sort()

    return (
      <Stack key={brand} gap="xs" mb="xs">
        <div>
          <Title order={3} mb="xs" c="dimmed">
            {brand}
          </Title>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 1, md: 2, lg: 2 }} spacing="md">
          {sortedModelNames.map((modelName) => {
            const models = brandModels[modelName]
            return models.map((model: UserModel) => <AgentCard key={model.id} model={model} />)
          })}
        </SimpleGrid>
      </Stack>
    )
  }

  return (
    <Mounted pageLoading={false} size="md">
      <PageTitle title="Agents" text="Manage your custom AI agents and their configurations" />

      <Group justify="flex-end" mb="md">
        <AgentCreateNew />
      </Group>

      {userModels && userModels.length > 0 ? (
        <Stack gap="xs">{sortedBrands.map(renderBrandSection)}</Stack>
      ) : (
        <Text c="dimmed">No agents found. Create your first agent to get started.</Text>
      )}
    </Mounted>
  )
}
