import { Button, Divider, Select, Stack, Text } from '@mantine/core'
import { RiArrowRightLine } from '@remixicon/react'

interface AvailableComponentsProps {
  selectedApp: any
  selectedComponent: any
  setSelectedComponent: (component: any) => void
  isMobile: boolean
}

export function AvailableComponents({ selectedApp, selectedComponent, setSelectedComponent, isMobile }: AvailableComponentsProps) {
  return (
    <Stack gap="md" pr={isMobile ? '0' : 'md'}>
      <Divider label="Available Tools" labelPosition="center" />
      {selectedApp?.actions?.length > 0 ? (
        isMobile ? (
          <Select
            label="Select a component"
            placeholder="Select a component"
            data={selectedApp.actions.map((item: any) => ({ value: item.key, label: item.name }))}
            value={selectedComponent?.key}
            onChange={(value) => setSelectedComponent(selectedApp.actions.find((item: any) => item.key === value))}
            style={{ width: '100%' }}
          />
        ) : (
          selectedApp?.actions?.map((item: any, index: any) => (
            <Button
              key={index}
              variant={selectedComponent?.key === item.key ? 'filled' : 'light'}
              onClick={() => setSelectedComponent(item)}
              justify="space-between"
              fullWidth
              rightSection={<RiArrowRightLine size={16} />}
            >
              {item.name}
            </Button>
          ))
        )
      ) : (
        <Text c="dimmed" ta="center" py="md">
          No components available for this app.
        </Text>
      )}
    </Stack>
  )
}
