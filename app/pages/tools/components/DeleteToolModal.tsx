import { ActionIcon, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiDeleteBinLine } from '@remixicon/react'
import { useState } from 'react'
import useToolsStore from '~/lib/store/toolsStore'

interface DeleteToolModalProps {
  tool: {
    id: string
    tool_name: string
  }
  onToolDeleted?: () => void
}

export default function DeleteToolModal({ tool, onToolDeleted }: DeleteToolModalProps) {
  const [opened, { open, close }] = useDisclosure(false)
  const [deleting, setDeleting] = useState(false)
  const { deleteTool } = useToolsStore()

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    const success = await deleteTool(tool.id)
    if (success) {
      close()
      onToolDeleted?.()
    }
    setDeleting(false)
  }

  return (
    <>
      <ActionIcon
        variant="light"
        color="red"
        size="xs"
        mr="lg"
        onClick={() => {
          open()
        }}
      >
        <RiDeleteBinLine size={14} />
      </ActionIcon>

      <Modal opened={opened} onClose={close} title="Delete Tool" size="sm">
        <Stack gap="md">
          <Text>Are you sure you want to delete the tool &quot;{tool.tool_name}&quot;? This action cannot be undone.</Text>

          <Group justify="flex-end">
            <Button variant="light" onClick={close}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={deleting}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
