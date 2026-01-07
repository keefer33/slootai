import { ActionIcon, Badge, Box, Button, Card, Group, Image, Modal, Pagination, Stack, Tabs, Text, TextInput } from '@mantine/core'
import { RiAddLine, RiCloseLine, RiFileLine, RiLinksLine, RiUploadLine } from '@remixicon/react'
import { useEffect, useMemo, useState } from 'react'
import { useFormContext } from '~/lib/ContextForm'
import useAgentsUtils from '~/lib/hooks/useAgentsUtils'
import useAiStore from '~/lib/store/aiStore'
import useFilesFoldersStore from '~/lib/store/filesFoldersStore'
import FileUpload from '~/pages/files/components/FileUpload'

interface AgentAttachFilesProps {
  userModel: {
    id: string
    name: string
  }
}

export default function AgentAttachFiles({ userModel }: AgentAttachFilesProps) {
  const { selectedModel, user } = useAiStore()
  const { paginationData, loading, gridLoading, setLoading, setGridLoading, loadUserFiles, setFiles } = useFilesFoldersStore()
  const { savePayload } = useAgentsUtils()
  const form = useFormContext()
  const [modalOpened, setModalOpened] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string | null>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Get file capabilities from selected model
  const fileCapabilities = selectedModel?.config?.capabilities?.files || { images: false, files: false }
  const canShowImages = fileCapabilities.images === true
  const canShowFiles = fileCapabilities.files === true

  // Filter files based on capabilities
  const filteredFiles = useMemo(() => {
    const filesToFilter = paginationData.data || []

    if (!canShowImages && !canShowFiles) {
      return [] // No file types supported
    }

    if (canShowImages && canShowFiles) {
      return filesToFilter // Show all files
    }

    if (canShowImages && !canShowFiles) {
      // Only show image files
      return filesToFilter.filter((file) => file.file_type?.toLowerCase().includes('image'))
    }

    if (!canShowImages && canShowFiles) {
      // Only show non-image files
      return filesToFilter.filter((file) => !file.file_type?.toLowerCase().includes('image'))
    }

    return []
  }, [paginationData.data, canShowImages, canShowFiles])

  const loadFiles = async (page = 1, isPageChange = false) => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    if (isPageChange) {
      setGridLoading(true)
    } else {
      setLoading(true)
    }

    try {
      await loadUserFiles(page, 12, null, user.id)
      // Also update the files in aiStore for backward compatibility
      setFiles(paginationData.data)
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      if (isPageChange) {
        setGridLoading(false)
      } else {
        setLoading(false)
      }
    }
  }

  // Load user files when component mounts
  useEffect(() => {
    if (user?.id) {
      loadFiles(currentPage)
    }
  }, [user?.id])

  // Update files in aiStore when paginationData changes
  useEffect(() => {
    if (paginationData.data) {
      setFiles(paginationData.data)
    }
  }, [paginationData.data, setFiles])

  // Get current files from form - memoized to prevent unnecessary re-renders
  const currentFiles = useMemo(() => {
    const allValues = form.getValues()
    const files = allValues?.files || []
    return Array.isArray(files) ? files : []
  }, [form])

  const addFile = async (file: any) => {
    const updatedFiles = [...currentFiles, { url: file.public_url || file.url, type: file.file_type || file.type }]
    form.setFieldValue('files', updatedFiles)
    // Save the updated payload
    try {
      await savePayload(form.getValues())
    } catch (error) {
      console.error('Error saving payload after adding file:', error)
    }
  }

  const removeFile = async (index: number) => {
    const updatedFiles = currentFiles.filter((_, i) => i !== index)
    form.setFieldValue('files', updatedFiles)

    // Save the updated payload
    try {
      await savePayload(form.getValues())
    } catch (error) {
      console.error('Error saving payload after removing file:', error)
    }
  }

  const handleUrlAdd = async () => {
    if (urlInput.trim()) {
      await addFile({
        type: 'url',
        url: urlInput.trim(),
        name: urlInput.trim().split('/').pop() || 'URL File',
        size: 0,
      })
      setUrlInput('')
    }
  }

  const handleFileSelect = async (file: any) => {
    await addFile(file)
  }

  const openModal = () => {
    // Only open modal if file attachment is supported
    if (canShowImages || canShowFiles) {
      setModalOpened(true)
    }
  }

  const closeModal = () => {
    setModalOpened(false)
    // Reload files when modal closes
    loadFiles(currentPage, true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadFiles(page, true)
  }

  return (
    <>
      {/* Check if file attachment is supported */}
      {!canShowImages && !canShowFiles ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          File attachment is not supported for this model.
        </Text>
      ) : (
        <>
          <Button justify="space-between" fullWidth variant="light" rightSection={<RiAddLine size={24} />} onClick={openModal}>
            Attached Files ({currentFiles.length})
          </Button>

          {/* Display attached files summary */}
          {currentFiles.length > 0 && (
            <Group gap="xs">
              {currentFiles.map((file, index) => (
                <Badge
                  key={index}
                  size="md"
                  variant="default"
                  leftSection={
                    file.type?.toLowerCase().includes('image') ? (
                      <Image src={file.url} alt={file.name} width={18} height={18} fit="contain" style={{ borderRadius: '50%' }} />
                    ) : (
                      <RiFileLine size={18} />
                    )
                  }
                  rightSection={
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={async (e) => {
                        e.stopPropagation()
                        await removeFile(index)
                      }}
                      title="Remove file"
                      style={{ marginLeft: 4 }}
                    >
                      <RiCloseLine size={16} />
                    </ActionIcon>
                  }
                  style={{ cursor: 'pointer' }}
                  onClick={async () => await removeFile(index)}
                >
                  {file.name || file.url || 'File'}
                </Badge>
              ))}
            </Group>
          )}
        </>
      )}

      <Modal opened={modalOpened} onClose={closeModal} title={`Attach Files - ${userModel?.name}`} size="lg">
        <Tabs value={selectedTab} onChange={setSelectedTab}>
          <Tabs.List>
            <Tabs.Tab value="upload" leftSection={<RiUploadLine size={16} />}>
              Upload
            </Tabs.Tab>
            <Tabs.Tab value="url" leftSection={<RiLinksLine size={16} />}>
              URL
            </Tabs.Tab>
            <Tabs.Tab value="attached" leftSection={<RiFileLine size={16} />}>
              Attached ({currentFiles.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="upload" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Upload new files to add to your agent&apos;s context.
              </Text>
              <FileUpload onUploadComplete={() => loadFiles(currentPage, true)} />
            </Stack>
            <Stack gap="md" mt="md">
              <Text size="sm" c="dimmed">
                Select from your previously uploaded files.
              </Text>
              {loading ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  Loading files...
                </Text>
              ) : filteredFiles.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No files uploaded yet. Upload files in the &quot;Upload&quot; tab first.
                </Text>
              ) : (
                <>
                  {paginationData.totalPages > 1 && (
                    <Pagination value={currentPage} onChange={handlePageChange} total={paginationData.totalPages} size="sm" radius="md" withEdges siblings={0} boundaries={1} />
                  )}

                  {gridLoading ? (
                    <Text size="sm" c="dimmed" ta="center" py="md">
                      Loading page...
                    </Text>
                  ) : (
                    <Stack gap="xs">
                      {filteredFiles.map((file) => (
                        <Card key={file.id} withBorder p="xs" style={{ cursor: 'pointer' }} onClick={() => handleFileSelect(file)}>
                          <Group justify="space-between">
                            <Group gap="sm">
                              <Box>
                                {file.file_type.toLowerCase().includes('image') ? (
                                  <Image src={file.public_url} alt={file.file_name} width={50} height={50} fit="contain" />
                                ) : (
                                  <RiFileLine size={20} />
                                )}
                              </Box>
                              <div>
                                <Text size="sm" fw={500}>
                                  {file.file_name}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {(file.file_size / 1024).toFixed(1)} KB
                                </Text>
                              </div>
                            </Group>
                            <Button variant="light" size="xs">
                              Select
                            </Button>
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  )}

                  {paginationData.totalPages > 1 && (
                    <Pagination value={currentPage} onChange={handlePageChange} total={paginationData.totalPages} size="sm" radius="md" withEdges siblings={0} boundaries={1} />
                  )}
                </>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="url" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Add files from URLs to provide context to your agent.
              </Text>

              {/* Show supported link types based on capabilities */}
              {!canShowImages && !canShowFiles ? (
                <Text size="sm" c="red" ta="center" py="md">
                  File attachment is not supported for this model.
                </Text>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  Supported link types:
                  {canShowImages && canShowFiles && ' Images and files'}
                  {canShowImages && !canShowFiles && ' Images only'}
                  {!canShowImages && canShowFiles && ' Files only (no images)'}
                </Text>
              )}

              <Group>
                <TextInput placeholder="https://example.com/file.pdf" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} style={{ flex: 1 }} />
                <Button onClick={handleUrlAdd} disabled={!urlInput.trim() || (!canShowImages && !canShowFiles)}>
                  Add URL
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="attached" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Currently attached files to your agent.
              </Text>
              {currentFiles.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No files attached yet. Add files from the Upload or URL tabs.
                </Text>
              ) : (
                <Group gap="xs" wrap="wrap">
                  {currentFiles.map((file, index) => (
                    <Badge
                      key={index}
                      size="md"
                      variant="default"
                      leftSection={
                        file.type?.toLowerCase().includes('image') ? (
                          <Image src={file.url} alt={file.name} width={18} height={18} fit="contain" style={{ borderRadius: '50%' }} />
                        ) : (
                          <RiFileLine size={18} />
                        )
                      }
                      rightSection={
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={async (e) => {
                            e.stopPropagation()
                            await removeFile(index)
                          }}
                          title="Remove file"
                          style={{ marginLeft: 4 }}
                        >
                          <RiCloseLine size={16} />
                        </ActionIcon>
                      }
                      style={{ cursor: 'pointer' }}
                      onClick={async () => await removeFile(index)}
                    >
                      {file.name || file.url || 'File'}
                    </Badge>
                  ))}
                </Group>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  )
}
