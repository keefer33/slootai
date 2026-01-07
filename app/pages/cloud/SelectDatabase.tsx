import { Button, Card, Center, Grid, Group, Loader, Stack, Text, TextInput } from '@mantine/core'
import { RiArrowLeftLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useDatabaseStore, type DatabaseTemplate } from '~/lib/store/databaseStore'
import DatabaseCard from '~/pages/cloud/components/DatabaseCard'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import CreateDatabaseModal from './components/CreateDatabaseModal'

export default function SelectDatabase() {
  const navigate = useNavigate()
  const { databaseTemplates, templatesLoading, loadDatabaseTemplates, setSelectedTemplate, setCreateModalOpened, createModalOpened } = useDatabaseStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTemplates, setFilteredTemplates] = useState<DatabaseTemplate[]>([])

  useEffect(() => {
    loadDatabaseTemplates()
  }, [loadDatabaseTemplates])

  useEffect(() => {
    let filtered = databaseTemplates

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (template) => template.name.toLowerCase().includes(searchQuery.toLowerCase()) || template.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredTemplates(filtered)
  }, [databaseTemplates, searchQuery])

  const handleSelectDatabase = (template: DatabaseTemplate) => {
    setSelectedTemplate(template)
    setCreateModalOpened(true)
  }

  const handleDatabaseCreated = (databaseId: string) => {
    navigate(`/account/cloud/database/${databaseId}`)
  }

  const handleBack = () => {
    navigate('/account/cloud')
  }

  if (templatesLoading) {
    return (
      <Center h="50vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading database templates...</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Mounted pageLoading={templatesLoading} size="md">
      <Stack gap="xs">
        <Group>
          <Button variant="subtle" leftSection={<RiArrowLeftLine size={16} />} onClick={handleBack}>
            Back to Cloud Services
          </Button>
        </Group>

        <PageTitle title="Select Database Template" text="Choose a database template to create your cloud database" />
      </Stack>
      <Stack gap="xl">
        <TextInput placeholder="Search databases by name or description..." value={searchQuery} onChange={(e) => setSearchQuery(e.currentTarget.value)} size="md" />

        {filteredTemplates.length === 0 ? (
          <Card p="xl" ta="center">
            <Stack gap="xl">
              <Text size="lg" c="dimmed">
                {searchQuery ? 'No databases found matching your search' : 'No database templates available'}
              </Text>
              {searchQuery && (
                <Button variant="light" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </Stack>
          </Card>
        ) : (
          <Grid>
            {filteredTemplates.map((template) => (
              <Grid.Col key={template.id} span={{ base: 12, sm: 6, md: 4, lg: 4 }}>
                <DatabaseCard
                  name={template.name}
                  description={template.description}
                  logo={template.logo}
                  homeUrl={template.home_url}
                  onClick={() => handleSelectDatabase(template)}
                >
                  <Button size="sm" fullWidth>
                    Select Database
                  </Button>
                </DatabaseCard>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Create Database Modal */}
      <CreateDatabaseModal opened={createModalOpened} onClose={() => setCreateModalOpened(false)} onSuccess={handleDatabaseCreated} />
    </Mounted>
  )
}
