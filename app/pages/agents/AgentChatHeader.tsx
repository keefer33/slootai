import { Group } from '@mantine/core'
import AgentSelect from './AgentSelect'

export default function AgentChatHeader() {
  return (
    <Group justify="space-between">
      <AgentSelect />
    </Group>
  )
}
