import { Button } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiAddLine } from '@remixicon/react'
import ToolModal from './ToolModal'

interface CreateToolModalProps {
  isAdmin?: boolean
  onToolCreated?: (tool: any) => void
}

export default function CreateToolModal({ isAdmin = false, onToolCreated }: CreateToolModalProps) {
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <Button size="xs" leftSection={<RiAddLine size={16} />} onClick={open}>
        Create Tool
      </Button>

      <ToolModal isAdmin={isAdmin} mode="create" onToolCreated={onToolCreated} opened={opened} onCloseModal={close} />
    </>
  )
}
