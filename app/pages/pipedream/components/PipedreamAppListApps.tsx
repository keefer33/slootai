import { Box, Center, Grid, Loader, Text } from '@mantine/core'
import { v4 as uuidv4 } from 'uuid'
import PipedreamCard from './PipedreamCard'

export default function PipedreamAppListApps({ apps, loading = false }) {
  if (loading) {
    return (
      <Center py="xl">
        <div style={{ textAlign: 'center' }}>
          <Loader size="lg" />
          <Text mt="md" c="dimmed">
            Loading apps...
          </Text>
        </div>
      </Center>
    )
  }

  if ((!apps || apps.length === 0) && !loading) {
    return (
      <Center py="xl">
        <Text c="dimmed">No apps found</Text>
      </Center>
    )
  }

  return (
    <>
      <Grid gutter="md">
        {apps?.map((app) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={uuidv4()}>
            <Box>
              <PipedreamCard app={app} />
            </Box>
          </Grid.Col>
        ))}
      </Grid>
    </>
  )
}
