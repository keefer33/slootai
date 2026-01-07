import { Button, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiBracesLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { DisplayJsonCodeMirror } from '~/shared/DisplayJsonCodeMirror'

export default function ChatMessageJson({ message, modalTitle }: any) {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [formattedMessage, setFormattedMessage] = useState('')

  useEffect(() => {
    try {
      // Try to parse and format the message as JSON
      const parsed = typeof message === 'string' ? JSON.parse(message) : message
      setFormattedMessage(JSON.stringify(parsed, null, 2))
    } catch {
      // If it's not valid JSON, just stringify it
      setFormattedMessage(JSON.stringify(message, null, 2))
    }
  }, [message])

  return (
    <>
      <Button size="xs" variant="default" onClick={openModal} leftSection={<RiBracesLine size={14} />}>
        {modalTitle}
      </Button>

      <Modal opened={modalOpened} onClose={closeModal} title={modalTitle} size="lg">
        <DisplayJsonCodeMirror value={formattedMessage} onChange={() => {}} readOnly />
      </Modal>
    </>
  )
}
