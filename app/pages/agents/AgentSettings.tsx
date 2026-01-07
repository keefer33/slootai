import { ActionIcon, Box, Drawer, Group } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiSoundModuleLine } from '@remixicon/react'
import { useEffect } from 'react'
import { useForm } from '~/lib/ContextForm'
import useAiStore from '~/lib/store/aiStore'
import AgentSettingsForm from './AgentSettingsForm'

export default function AgentSettings() {
  const { selectedModel, selectedAgent } = useAiStore()
  const [opened, { open, close }] = useDisclosure(false)

  const form = useForm({
    mode: 'uncontrolled',
  })

  const init = async () => {
    form.setValues(selectedAgent)
  }

  useEffect(() => {
    init()
  }, [selectedAgent])

  return (
    <Box>
      <Group justify="space-between">
        <Group justify="flex-end">
          {selectedModel?.id && (
            <ActionIcon variant="light" size="md" onClick={open}>
              <RiSoundModuleLine />
            </ActionIcon>
          )}
        </Group>
      </Group>
      <Drawer opened={opened} onClose={close} title="Settings" position="right">
        <AgentSettingsForm />
      </Drawer>
    </Box>
  )
}
