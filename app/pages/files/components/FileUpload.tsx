import { Alert, Box, Group, Text } from '@mantine/core'
import { RiUploadLine } from '@remixicon/react'
import { useRef, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import useFilesFoldersStore from '~/lib/store/filesFoldersStore'

interface FileUploadProps {
  onUploadComplete?: () => void
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAiStore()
  const { uploadFile, uploading, refreshData } = useFilesFoldersStore()

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id) return

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await uploadFile(file, user.id)
      }

      // Refresh data after upload
      await refreshData(user.id)
      onUploadComplete?.()
    } catch (error) {
      console.error('Error uploading files:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Box>
      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => handleFileSelect(e.target.files)} />
      <Group justify="center">
        <Alert
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseOver={() => setDragOver(true)}
          onMouseLeave={() => setDragOver(false)}
          variant={dragOver ? 'filled' : 'light'}
          title="Click to upload or drag files here"
          icon={<RiUploadLine size={20} />}
        >
          Support for multiple files. Max file size: 50MB
        </Alert>

        {uploading && (
          <Text size="sm" c="blue" ta="center" mt="sm">
            Uploading files...
          </Text>
        )}
      </Group>
    </Box>
  )
}
