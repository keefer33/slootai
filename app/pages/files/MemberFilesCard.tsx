import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Image,
  LoadingOverlay,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiDeleteBinLine, RiDownloadLine, RiEditLine, RiFileLine, RiFilePdf2Fill, RiFileTextLine, RiFolderLine, RiImageLine, RiPlayLine } from '@remixicon/react'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import useFilesFoldersStore from '~/lib/store/filesFoldersStore'
import { formatDate, formatFileSize, getFileExtension, isTextFile } from '~/lib/utils'

interface FileData {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  public_url: string
  created_at: string
  folder_id?: string | null
}

interface Folder {
  id: string
  name: string
  created_at: string
}

interface MemberFilesCardProps {
  file: FileData
  folders: Folder[]
  onFileUpdate?: () => void
  selected?: boolean
  onSelect?: (selected: boolean) => void
}

export default function MemberFilesCard({ file, folders, onFileUpdate, selected = false, onSelect }: MemberFilesCardProps) {
  const theme = useMantineTheme()
  const [opened, { close }] = useDisclosure(false)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [moveOpened, { open: openMove, close: closeMove }] = useDisclosure(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)
  const [newFileName, setNewFileName] = useState(file.file_name)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(file.folder_id || null)
  const [currentFile, setCurrentFile] = useState(file)
  const { user } = useAiStore()
  const { deleteFile, updateFileName, moveFileToFolder } = useFilesFoldersStore()

  // Update currentFile when file prop changes
  useEffect(() => {
    setCurrentFile(file)
    setNewFileName(file.file_name)
    setSelectedFolderId(file.folder_id || null)
  }, [file])

  const handleDelete = async () => {
    if (!user?.id) return

    setDeleting(true)
    try {
      const success = await deleteFile(file.id, file.file_path, user.id)
      if (success) {
        // Call the parent's update function to refresh the current page
        if (onFileUpdate) {
          onFileUpdate()
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = () => {
    window.open(currentFile.public_url, '_blank')
  }

  const handleEdit = () => {
    setNewFileName(currentFile.file_name)
    openEdit()
  }

  const handleSaveEdit = async () => {
    if (!user?.id || newFileName.trim() === '' || newFileName === currentFile.file_name) {
      closeEdit()
      return
    }

    setEditing(true)
    try {
      const result = await updateFileName(currentFile.id, newFileName.trim(), user.id)
      if (result && typeof result === 'object' && result.success && result.updatedFile) {
        // Update the local file state with the updated file data
        setCurrentFile((prev) => ({
          ...prev,
          file_name: result.updatedFile.file_name,
          file_path: result.updatedFile.file_path,
          public_url: result.updatedFile.public_url,
        }))
        closeEdit()
        // Call the parent's update function to refresh the current page
        if (onFileUpdate) {
          onFileUpdate()
        }
      }
    } catch (error) {
      console.error('Error updating file name:', error)
    } finally {
      setEditing(false)
    }
  }

  const handleMoveFile = async () => {
    if (!user?.id) return

    const targetFolderId = selectedFolderId || null
    if (targetFolderId === currentFile.folder_id) {
      closeMove()
      return
    }

    setMoving(true)
    try {
      const result = await moveFileToFolder(currentFile.id, targetFolderId, user.id)
      if (result.success) {
        // Update the local file state
        setCurrentFile((prev) => ({
          ...prev,
          folder_id: targetFolderId,
        }))
        closeMove()
        // Call the parent's update function to refresh the current page
        if (onFileUpdate) {
          onFileUpdate()
        }
      }
    } catch (error) {
      console.error('Error moving file:', error)
    } finally {
      setMoving(false)
    }
  }

  const getFileIcon = (size: number = 24) => {
    if (currentFile.file_type.startsWith('image/')) {
      return <RiImageLine size={size} />
    }
    if (currentFile.file_type.startsWith('video/')) {
      return <RiPlayLine size={size} />
    }
    if (currentFile.file_type === 'application/pdf') {
      return <RiFilePdf2Fill size={size} />
    }
    if (currentFile.file_type.startsWith('text/') || isTextFile(currentFile.file_name)) {
      return <RiFileTextLine size={size} />
    }
    return <RiFileLine size={size} />
  }

  const getFileTypeBadge = () => {
    const ext = getFileExtension(currentFile.file_name)
    if (currentFile.file_type.startsWith('image/')) {
      return (
        <Badge color="green" variant="light" size="sm">
          Image
        </Badge>
      )
    }
    if (currentFile.file_type.startsWith('video/')) {
      return (
        <Badge color="purple" variant="light" size="sm">
          Video
        </Badge>
      )
    }
    if (currentFile.file_type === 'application/pdf') {
      return (
        <Badge color="red" variant="light" size="sm">
          PDF
        </Badge>
      )
    }
    if (currentFile.file_type.startsWith('text/') || isTextFile(currentFile.file_name)) {
      return (
        <Badge color="blue" variant="light" size="sm">
          Text
        </Badge>
      )
    }
    return (
      <Badge color="gray" variant="light" size="sm">
        {ext.toUpperCase()}
      </Badge>
    )
  }

  return (
    <>
      <Card
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          borderColor: selected ? theme.primaryColor : undefined,
        }}
        pos="relative"
      >
        <LoadingOverlay visible={deleting} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} loaderProps={{ type: 'dots' }} />

        <Card.Section>
          {/* Selection Checkbox */}
          {onSelect && (
            <Box pos="absolute" top={8} right={8} style={{ zIndex: 10 }}>
              <Checkbox checked={selected} onChange={(event) => onSelect(event.currentTarget.checked)} size="sm" />
            </Box>
          )}
          {currentFile.file_type.startsWith('image/') ? (
            <Image src={currentFile.public_url} height={240} alt={currentFile.file_name} />
          ) : currentFile.file_type.startsWith('video/') ? (
            <video src={currentFile.public_url} height={240} style={{ width: '100%', objectFit: 'cover' }} controls preload="metadata" poster="">
              Your browser does not support the video tag.
            </video>
          ) : (
            <Center h={240}>
              <Box>{getFileIcon(200)}</Box>
            </Center>
          )}
        </Card.Section>

        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Group gap="sm">
              {getFileIcon()}
              <Stack gap={4}>
                <Text fw={500} size="sm" lineClamp={2}>
                  {currentFile.file_name}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatFileSize(currentFile.file_size)}
                </Text>
              </Stack>
            </Group>
            <Group gap={4}>
              <Tooltip label="Download">
                <ActionIcon variant="light" size="sm" onClick={handleDownload}>
                  <RiDownloadLine size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Edit">
                <ActionIcon variant="light" size="sm" color="blue" onClick={handleEdit}>
                  <RiEditLine size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Move to Folder">
                <ActionIcon variant="light" size="sm" color="orange" onClick={openMove}>
                  <RiFolderLine size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete">
                <ActionIcon variant="light" size="sm" color="red" onClick={handleDelete} loading={deleting}>
                  <RiDeleteBinLine size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <Group gap="xs">
            {getFileTypeBadge()}
            <Text size="xs" c="dimmed">
              {formatDate(currentFile.created_at)}
            </Text>
          </Group>
        </Stack>
      </Card>
      <Modal size="lg" opened={opened} onClose={close} title="File">
        <Stack>
          <Table variant="vertical" layout="fixed" withTableBorder>
            <Table.Tbody>
              <Table.Tr>
                <Table.Th w={160}>File Name</Table.Th>
                <Table.Td>
                  <Anchor href={currentFile.public_url} target="_blank">
                    {currentFile.file_name}
                  </Anchor>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Date Created</Table.Th>
                <Table.Td>{`${dayjs(currentFile.created_at).format('MM/DD/YYYY h:mm A')}`}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>File Size</Table.Th>
                <Table.Td>{formatFileSize(currentFile.file_size)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>File Type</Table.Th>
                <Table.Td>{currentFile.file_type.toUpperCase()}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>
      </Modal>

      <Modal opened={editOpened} onClose={closeEdit} title="Edit File Name" size="md">
        <Stack gap="md">
          <TextInput label="File Name" value={newFileName} onChange={(event) => setNewFileName(event.currentTarget.value)} placeholder="Enter new file name" required />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={editing}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={moveOpened} onClose={closeMove} title="Move File to Folder" size="md">
        <Stack gap="md">
          <Select
            label="Select Folder"
            value={selectedFolderId || ''}
            onChange={(value) => setSelectedFolderId(value || null)}
            placeholder="Choose a folder"
            data={[{ value: '', label: 'Root (All Files)' }, ...folders.map((folder) => ({ value: folder.id, label: folder.name }))]}
            clearable
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeMove}>
              Cancel
            </Button>
            <Button onClick={handleMoveFile} loading={moving}>
              Move
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
