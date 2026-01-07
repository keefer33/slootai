import { Divider, Grid, Group, Text, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useEffect } from 'react'
import { useLoaderData, useNavigate } from 'react-router'
import { getToolsSloot } from '~/api/supabase/admin/getToolsSloot'
import useAiStore from '~/lib/store/aiStore'
import useToolsStore, { type Tool } from '~/lib/store/toolsStore'
import { ApiConnectionManager } from '~/shared/ApiConnectionManager'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import { ToolCard } from '~/shared/ToolCard'
import CreateToolModal from './components/CreateToolModal'

export async function loader() {
  const { slootTools, slootToolsError } = await getToolsSloot()

  if (slootToolsError) {
    throw slootToolsError
  }

  return { slootTools: slootTools }
}

export default function Tools() {
  const navigate = useNavigate()
  const { slootTools } = useLoaderData<typeof loader>()
  const { isAdmin, loading, setLoading } = useAiStore()
  const { tools, loadTools, setSelectedTool, loadSlootTools } = useToolsStore()
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)

  const init = async () => {
    setLoading(true)
    await Promise.all([loadTools('custom'), loadTools('pipedream'), loadSlootTools()])
    setLoading(false)
  }

  // Call init on component mount
  useEffect(() => {
    init()
  }, [])

  const handleEdit = (tool: Tool) => {
    navigate(`/account/tools/${tool.id}`)
  }

  const handleDelete = (tool: Tool) => {
    setSelectedTool(tool as unknown as Tool)
  }

  const handleToolCreated = async (newTool: Tool) => {
    await init() // Reload tools after creation
    // Navigate to the new tool's editor
    navigate(`/account/tools/${newTool.id}`)
  }

  const handleToolDeleted = () => {
    init() // Reload tools after deletion
  }

  const handleOpenEditor = (tool: Tool) => {
    navigate(`/account/tools/${tool.id}`)
  }

  const getToolCards = (toolsList: any[], filter?: 'custom' | 'pipedream' | null) => {
    let userToolsList = []
    if (filter === 'pipedream') {
      userToolsList = toolsList?.filter((tool) => tool.is_pipedream) || []
    } else if (filter === 'custom') {
      userToolsList = toolsList?.filter((tool) => !tool.is_pipedream) || []
    } else {
      userToolsList = toolsList
    }
    return userToolsList.map((tool) => {
      return (
        <Grid.Col key={tool.id} span={isMobile ? 12 : 4}>
          <ToolCard
            tool={tool as unknown as Tool}
            onEdit={handleEdit}
            onDelete={(tool.is_sloot && !isAdmin) || tool.is_pipedream ? undefined : handleDelete}
            onClick={handleOpenEditor}
            onToolDeleted={handleToolDeleted}
          />
        </Grid.Col>
      )
    })
  }

  return (
    <Mounted pageLoading={loading}>
      <PageTitle title="Tools" text="Manage your standalone tools" />

      <Group justify="flex-end" mb="md">
        <ApiConnectionManager mode="manage" />
        <CreateToolModal isAdmin={isAdmin} onToolCreated={handleToolCreated} />
      </Group>

      <Grid mt="lg">
        {tools?.filter((tool) => !tool.is_pipedream).length === 0 ? (
          <Grid.Col span={12}>
            <Text c="dimmed">No custom tools found. Create your first tool to get started.</Text>
          </Grid.Col>
        ) : (
          getToolCards(tools, 'custom')
        )}
      </Grid>
      <Divider my="xl" label="Sloot Tools" labelPosition="center" />
      <Grid mt="lg">
        {slootTools?.length === 0 ? (
          <Grid.Col span={12}>
            <Text c="dimmed">No sloot tools found. Create your first sloot tool to get started.</Text>
          </Grid.Col>
        ) : (
          getToolCards(slootTools)
        )}
      </Grid>
      <Divider my="xl" label="Pipedream Tools" labelPosition="center" />
      <Grid mt="lg">
        {tools?.filter((tool) => tool.is_pipedream).length === 0 ? (
          <Grid.Col span={12}>
            <Text c="dimmed">No pipedream tools found. Create your first pipedream tool to get started.</Text>
          </Grid.Col>
        ) : (
          getToolCards(tools, 'pipedream')
        )}
      </Grid>
    </Mounted>
  )
}
