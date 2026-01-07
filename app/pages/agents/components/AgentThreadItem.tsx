import { ActionIcon, Group, NavLink, Text, TextInput } from '@mantine/core'
import { useHover } from '@mantine/hooks'
import { RiCheckLine, RiCloseLine, RiDeleteBinLine, RiEditLine } from '@remixicon/react'
import { useState } from 'react'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import useThreadsStore from '~/lib/store/threadsStore'
import { formatDate } from '~/lib/utils'

export const AgentThreadItem = ({ thread }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(thread.name)
  const { hovered, ref } = useHover()
  const { api, selectedAgent, loading } = useAiStore()
  const { threads, setThreads, selectedThread, setSelectedThread, deleteThread, clearThread, loadThreadHistory } = useThreadsStore()

  const handleSave = async () => {
    if (editName.trim() === '') {
      showNotification({ title: 'Error', message: 'Thread name cannot be empty', type: 'error' })
      return
    }

    const { error } = await api.from('threads').update({ name: editName.trim() }).eq('id', thread.id)
    if (error) {
      console.error('Error updating thread:', error)
      showNotification({ title: 'Error', message: 'Failed to update thread name', type: 'error' })
      return
    }

    // Update the thread in the local state
    const updatedThreads = threads.map((t) => (t.id === thread.id ? { ...t, name: editName.trim() } : t))
    setThreads(updatedThreads)

    // Update selectedThread if it's the current one
    if (selectedThread?.id === thread.id) {
      setSelectedThread({ ...selectedThread, title: editName.trim() })
    }

    setIsEditing(false)
    showNotification({ title: 'Success', message: 'Thread name updated successfully', type: 'success' })
  }

  const handleCancel = () => {
    setEditName(thread.name)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleEditClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!loading) {
      setIsEditing(true)
      setEditName(thread.name)
    }
  }

  const handleDeleteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!loading) {
      deleteThread(thread.id, selectedAgent.id)
    }
  }

  const handleSaveClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!loading) {
      handleSave()
    }
  }

  const handleCancelClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!loading) {
      handleCancel()
    }
  }

  const loadThread = async (threadId) => {
    clearThread()
    const thread = threads.find((t) => t.id === threadId)
    setSelectedThread(thread)
    await loadThreadHistory()
  }

  return (
    <>
      {isEditing ? (
        <TextInput
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          size="xs"
          autoFocus
          disabled={loading}
          rightSectionWidth={50}
          rightSection={
            <Group gap="4">
              <ActionIcon size="xs" variant="light" color="green.5" onClick={handleSaveClick} title="Save changes" disabled={loading}>
                <RiCheckLine size={15} />
              </ActionIcon>
              <ActionIcon size="xs" variant="subtle" color="gray.5" onClick={handleCancelClick} title="Cancel editing" disabled={loading}>
                <RiCloseLine size={15} />
              </ActionIcon>
            </Group>
          }
        />
      ) : (
        <div ref={ref}>
          <NavLink
            key={thread.id}
            active={selectedThread?.id === thread.id}
            onClick={() => !loading && loadThread(thread.id)}
            disabled={loading}
            p={selectedThread?.id === thread.id ? 'xs' : '0'}
            c={loading ? 'dimmed' : 'inherit'}
            label={
              <>
                <Text size="sm" truncate="end">
                  {thread.name}
                </Text>
                <Group justify="space-between" align="center" gap="sm">
                  <Text size="xs" c="dimmed">
                    {formatDate(thread.created_at)}
                  </Text>
                  <Group gap="xs" h={20}>
                    {hovered && (
                      <>
                        <ActionIcon size="xs" variant="subtle" color="yellow.5" onClick={handleEditClick} title="Edit thread name" disabled={loading}>
                          <RiEditLine size={12} />
                        </ActionIcon>
                        <ActionIcon size="xs" variant="subtle" color="red.5" onClick={handleDeleteClick} title="Delete thread" disabled={loading}>
                          <RiDeleteBinLine size={12} />
                        </ActionIcon>
                      </>
                    )}
                  </Group>
                </Group>
              </>
            }
            styles={{
              root: {
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                opacity: loading ? 0.6 : 1,
                pointerEvents: loading ? 'none' : 'auto',
              },
            }}
          />
        </div>
      )}
    </>
  )
}
