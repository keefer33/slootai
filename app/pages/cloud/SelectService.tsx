import { Button, Card, Center, Grid, Group, Loader, Stack, Text, TextInput } from '@mantine/core'
import { RiArrowLeftLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import useCloudStore, { type CloudServiceTemplate } from '~/lib/store/cloudStore'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import CloudServiceCard from './components/CloudServiceCard'
import CreateServiceModal from './components/CreateServiceModal'

export default function SelectService() {
  const navigate = useNavigate()
  const { serviceTemplates, templatesLoading, loadServiceTemplates, setSelectedTemplate, setCreateModalOpened, createModalOpened } = useCloudStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredTemplates, setFilteredTemplates] = useState<CloudServiceTemplate[]>([])

  // Define available categories based on the database
  const categories = [
    'ai',
    'analytics',
    'auth',
    'automation',
    'backend',
    'cms',
    'ci',
    'database',
    'devtools',
    'email',
    'git',
    'media',
    'messaging',
    'mattermost',
    'monitoring',
    'productivity',
    'proxy',
    'search',
    'security',
    'storage',
    'vpn',
    'vps',
  ]

  useEffect(() => {
    loadServiceTemplates()
  }, [])

  useEffect(() => {
    let filtered = serviceTemplates

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((template) => template.category === selectedCategory)
    }

    setFilteredTemplates(filtered)
  }, [serviceTemplates, searchQuery, selectedCategory])

  const handleSelectService = (template: CloudServiceTemplate) => {
    setSelectedTemplate(template)
    setCreateModalOpened(true)
  }

  const handleServiceCreated = (serviceId: string) => {
    navigate(`/account/cloud/service/${serviceId}`)
  }

  const handleBack = () => {
    navigate('/account/cloud')
  }

  if (templatesLoading) {
    return (
      <Center h="50vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading service templates...</Text>
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

        <PageTitle title="Select Service Template" text="Choose a service template to create your cloud service" />
      </Stack>
      <Stack gap="xl">
        <TextInput placeholder="Search services by name, description, category, or tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.currentTarget.value)} size="md" />

        {/* Category Filter */}
        {categories.length > 0 && (
          <Group gap="xs" wrap="wrap">
            <Button variant={selectedCategory === null ? 'filled' : 'outline'} size="xs" onClick={() => setSelectedCategory(null)}>
              All Categories
            </Button>
            {categories.map((category) => (
              <Button key={category} variant={selectedCategory === category ? 'filled' : 'outline'} size="xs" onClick={() => setSelectedCategory(category)}>
                {category}
              </Button>
            ))}
          </Group>
        )}

        {filteredTemplates.length === 0 ? (
          <Card p="xl" ta="center">
            <Stack gap="xl">
              <Text size="lg" c="dimmed">
                {searchQuery ? 'No services found matching your search' : 'No service templates available'}
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
                <CloudServiceCard
                  name={template.name}
                  description={template.description || undefined}
                  category={template.category || undefined}
                  tags={template.tags || undefined}
                  logo={template.logo || undefined}
                  homeUrl={template.home_url || undefined}
                  onClick={() => handleSelectService(template)}
                >
                  <Button size="sm" fullWidth>
                    Select Service
                  </Button>
                </CloudServiceCard>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Create Service Modal */}
      <CreateServiceModal opened={createModalOpened} onClose={() => setCreateModalOpened(false)} onSuccess={handleServiceCreated} />
    </Mounted>
  )
}
