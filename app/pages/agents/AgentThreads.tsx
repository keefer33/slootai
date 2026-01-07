import { ActionIcon, AppShell, Button, Group, Modal, ScrollArea, Stack, Text, Title } from '@mantine/core'
import { RiAddLine, RiDeleteBinLine, RiHistoryLine } from '@remixicon/react'
import { useState } from 'react'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import useThreadsStore from '~/lib/store/threadsStore'
import { AgentThreadItem } from './components/AgentThreadItem'

export default function AgentThreads() {
  const { selectedAgent, loading } = useAiStore()
  const { loadThreadHistory, selectedThread, threads, deleteAllThreads, clearThread } = useThreadsStore()

  const availableThreads = threads?.filter((thread) => thread.id !== selectedThread?.id) || []
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)

  const handleDeleteAllThreads = async () => {
    if (!threads || threads.length === 0) return

    try {
      await deleteAllThreads(selectedAgent.id)
      setShowDeleteAllModal(false)
      showNotification({ title: 'Success', message: 'All threads deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Error deleting all threads:', error)
      showNotification({ title: 'Error', message: 'Failed to delete all threads', type: 'error' })
    }
  }

  return (
    <>
      <AppShell.Section p="sm">
        <Group justify="space-between">
          <Title order={4}>Threads</Title>
          <ActionIcon size="md" variant="light" onClick={() => clearThread()} title="New Thread" disabled={loading}>
            <RiAddLine size={24} />
          </ActionIcon>
        </Group>
      </AppShell.Section>

      {selectedThread && (
        <AppShell.Section p="sm">
          <Stack gap="xs">
            <Group justify="space-between">
              <Title order={5}>Current Thread</Title>
              <ActionIcon size="md" variant="light" onClick={loadThreadHistory} title="Show history" disabled={loading}>
                <RiHistoryLine size={24} />
              </ActionIcon>
            </Group>

            <AgentThreadItem thread={selectedThread} />
          </Stack>
        </AppShell.Section>
      )}

      <AppShell.Section grow component={ScrollArea} offsetScrollbars p="0">
        {availableThreads?.length > 0 && (
          <>
            <Group gap="xs" p="xs">
              <Title order={5}>All Threads ({availableThreads.length})</Title>
              <ActionIcon size="sm" variant="light" color="red.5" onClick={() => setShowDeleteAllModal(true)} title="Delete All Threads" disabled={loading}>
                <RiDeleteBinLine size={16} />
              </ActionIcon>
            </Group>
            <Stack gap="lg" p="xs">
              {availableThreads.map((thread) => (
                <AgentThreadItem key={thread.id} thread={thread} />
              ))}
            </Stack>
          </>
        )}
      </AppShell.Section>

      {/* Delete All Confirmation Modal */}
      <Modal opened={showDeleteAllModal} onClose={() => setShowDeleteAllModal(false)} title="Delete All Threads" centered size="sm">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Are you sure you want to delete all {threads?.length || 0} threads? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="light" onClick={() => setShowDeleteAllModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button color="red.5" onClick={handleDeleteAllThreads} loading={loading}>
              Delete All
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
