import { Button, Checkbox, Grid, Group, Modal, Pagination, ScrollArea, Select, SimpleGrid, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'
import useFilesFoldersStore from '~/lib/store/filesFoldersStore'
import MemberFilesCard from '~/pages/files/MemberFilesCard'
import Mounted from '~/shared/Mounted'
import { PageTitle } from '~/shared/PageTitle'
import FileUpload from './components/FileUpload'
import FolderManager from './components/FolderManager'

export default function MemberFiles() {
  const [currentPage, setCurrentPage] = useState(1)
  const [foldersCollapsed, setFoldersCollapsed] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [selectedFileData, setSelectedFileData] = useState<Map<string, any>>(new Map())
  const [moveModalOpened, { open: openMoveModal, close: closeMoveModal }] = useDisclosure(false)
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
  const [selectedMoveFolderId, setSelectedMoveFolderId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const { user } = useAiStore()
  const {
    selectedFolderId,
    folders,
    paginationData,
    loading,
    gridLoading,
    setSelectedFolderId,
    setLoading,
    setGridLoading,
    loadUserFiles,
    loadUserFolders,
    moveFileToFolder,
    deleteFile,
  } = useFilesFoldersStore()

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
      await loadUserFiles(page, 12, selectedFolderId, user.id)
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

  const loadFolders = async () => {
    if (!user?.id) return

    try {
      await loadUserFolders(user.id)
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadFiles(currentPage)
      loadFolders()
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      setCurrentPage(1)
      loadFiles(1, true)
    }
  }, [selectedFolderId])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadFiles(page, true)
  }

  const handleFileUpdate = () => {
    loadFiles(currentPage, true)
  }

  const handleFolderUpdate = () => {
    loadFolders()
    loadFiles(currentPage, true)
  }

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId)
  }

  // Multi-select functionality
  const handleFileSelect = (fileId: string, selected: boolean) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(fileId)
        // Store file data when selecting
        const file = paginationData.data.find((f) => f.id === fileId)
        if (file) {
          setSelectedFileData((prevData) => {
            const newMap = new Map(prevData)
            newMap.set(fileId, file)
            return newMap
          })
        }
      } else {
        newSet.delete(fileId)
        // Remove file data when deselecting
        setSelectedFileData((prevData) => {
          const newMap = new Map(prevData)
          newMap.delete(fileId)
          return newMap
        })
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Add all files from current page to existing selection
      setSelectedFiles((prev) => {
        const newSet = new Set(prev)
        paginationData.data.forEach((file) => newSet.add(file.id))
        return newSet
      })
      // Store file data for all current page files
      setSelectedFileData((prevData) => {
        const newMap = new Map(prevData)
        paginationData.data.forEach((file) => newMap.set(file.id, file))
        return newMap
      })
    } else {
      // Remove all files from current page from selection
      setSelectedFiles((prev) => {
        const newSet = new Set(prev)
        paginationData.data.forEach((file) => newSet.delete(file.id))
        return newSet
      })
      // Remove file data for all current page files
      setSelectedFileData((prevData) => {
        const newMap = new Map(prevData)
        paginationData.data.forEach((file) => newMap.delete(file.id))
        return newMap
      })
    }
  }

  // Check if all files on current page are selected
  const selectedOnCurrentPage = paginationData.data.filter((file) => selectedFiles.has(file.id))
  const isAllSelected = paginationData.data.length > 0 && selectedOnCurrentPage.length === paginationData.data.length
  const isIndeterminate = selectedOnCurrentPage.length > 0 && selectedOnCurrentPage.length < paginationData.data.length

  // Bulk operations
  const handleBulkMove = async () => {
    if (!user?.id || selectedFiles.size === 0) return

    setBulkLoading(true)
    try {
      // Get all selected files using stored file data
      const allSelectedFiles = Array.from(selectedFiles)
        .map((fileId) => selectedFileData.get(fileId))
        .filter(Boolean)

      if (allSelectedFiles.length === 0) {
        console.warn('No file data available for selected files')
        setBulkLoading(false)
        return
      }

      const movePromises = allSelectedFiles.map((file) => {
        return moveFileToFolder(file.id, selectedMoveFolderId, user.id)
      })

      const results = await Promise.all(movePromises)
      const successCount = results.filter((r) => r.success).length

      if (successCount > 0) {
        setSelectedFiles(new Set())
        setSelectedFileData(new Map())
        closeMoveModal()
        loadFiles(currentPage, true)
      }
    } catch (error) {
      console.error('Error moving files:', error)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!user?.id || selectedFiles.size === 0) return

    setBulkLoading(true)
    try {
      // Get all selected files using stored file data
      const allSelectedFiles = Array.from(selectedFiles)
        .map((fileId) => selectedFileData.get(fileId))
        .filter(Boolean)

      if (allSelectedFiles.length === 0) {
        console.warn('No file data available for selected files')
        setBulkLoading(false)
        return
      }

      const deletePromises = allSelectedFiles.map((file) => {
        return deleteFile(file.id, file.file_path, user.id)
      })

      const results = await Promise.all(deletePromises)
      const successCount = results.filter((r) => r).length

      if (successCount > 0) {
        setSelectedFiles(new Set())
        setSelectedFileData(new Map())
        closeDeleteModal()
        loadFiles(currentPage, true)
      }
    } catch (error) {
      console.error('Error deleting files:', error)
    } finally {
      setBulkLoading(false)
    }
  }

  // Clear selection only when folder changes (not when page changes)
  useEffect(() => {
    setSelectedFiles(new Set())
    setSelectedFileData(new Map())
  }, [selectedFolderId])

  // Don't render anything if user is not loaded yet
  if (!user) {
    return (
      <Mounted pageLoading={loading}>
        <PageTitle title="Files" text="Manage your custom files here." />
        <Text ta="center" c="dimmed">
          Loading...
        </Text>
      </Mounted>
    )
  }

  return (
    <Mounted pageLoading={loading} size="full">
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <ScrollArea h={{ base: 'auto', md: 'calc(100vh - 170px)' }} type="hover">
            <Stack gap="md" p={{ base: 0, md: 'md' }}>
              <PageTitle title="Files" text="Manage your custom files here." />
              <FileUpload onUploadComplete={handleFileUpdate} />
              <FolderManager
                folders={folders}
                onFolderUpdate={handleFolderUpdate}
                onFolderSelect={handleFolderSelect}
                selectedFolderId={selectedFolderId}
                collapsed={foldersCollapsed}
                onToggleCollapse={() => setFoldersCollapsed(!foldersCollapsed)}
              />
            </Stack>
          </ScrollArea>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 9 }}>
          <Stack gap="xl">
            {loading ? (
              <Text ta="center" c="dimmed">
                Loading files...
              </Text>
            ) : (
              <>
                {paginationData.totalPages > 1 && (
                  <Pagination value={currentPage} onChange={handlePageChange} total={paginationData.totalPages} size="sm" radius="md" withEdges siblings={0} boundaries={1} />
                )}

                {gridLoading ? (
                  <Text ta="center" c="dimmed">
                    Loading page...
                  </Text>
                ) : paginationData.data.length === 0 ? (
                  <Text ta="center" c="dimmed">
                    No files uploaded yet. Upload your first file to get started.
                  </Text>
                ) : (
                  <>
                    {/* Bulk Actions */}
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={isIndeterminate}
                          onChange={(event) => handleSelectAll(event.currentTarget.checked)}
                          label={`Select All (${selectedFiles.size}/${paginationData.data.length})`}
                        />
                      </Group>
                      {selectedFiles.size > 0 && (
                        <Group gap="sm">
                          <Button variant="light" color="blue" size="sm" onClick={openMoveModal} disabled={bulkLoading}>
                            Move Selected ({selectedFiles.size})
                          </Button>
                          <Button variant="light" color="red" size="sm" onClick={openDeleteModal} disabled={bulkLoading}>
                            Delete Selected ({selectedFiles.size})
                          </Button>
                        </Group>
                      )}
                    </Group>

                    <ScrollArea h={{ base: 'auto', md: `calc(100vh - 240px)` }} type="hover">
                      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" p={{ base: 0, md: 'md' }}>
                        {paginationData.data.map((file) => (
                          <MemberFilesCard
                            key={file.id}
                            file={file}
                            folders={folders}
                            onFileUpdate={handleFileUpdate}
                            selected={selectedFiles.has(file.id)}
                            onSelect={(selected) => handleFileSelect(file.id, selected)}
                          />
                        ))}
                      </SimpleGrid>
                    </ScrollArea>
                  </>
                )}

                {paginationData.totalPages > 1 && (
                  <Pagination
                    value={currentPage}
                    onChange={handlePageChange}
                    total={paginationData.totalPages}
                    size="sm"
                    radius="md"
                    withEdges
                    siblings={0}
                    boundaries={1}
                    hiddenFrom="md"
                  />
                )}
              </>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Bulk Move Modal */}
      <Modal opened={moveModalOpened} onClose={closeMoveModal} title="Move Selected Files" size="md">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Move {selectedFiles.size} selected file{selectedFiles.size > 1 ? 's' : ''} to a folder.
          </Text>
          <Select
            label="Select Destination Folder"
            value={selectedMoveFolderId || ''}
            onChange={(value) => setSelectedMoveFolderId(value || null)}
            placeholder="Choose a folder"
            data={[{ value: '', label: 'Root (All Files)' }, ...folders.map((folder) => ({ value: folder.id, label: folder.name }))]}
            clearable
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeMoveModal} disabled={bulkLoading}>
              Cancel
            </Button>
            <Button onClick={handleBulkMove} loading={bulkLoading} disabled={!selectedMoveFolderId && selectedMoveFolderId !== null}>
              Move Files
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Delete Selected Files" size="md">
        <Stack gap="md">
          <Text size="sm" c="red">
            Are you sure you want to delete {selectedFiles.size} selected file{selectedFiles.size > 1 ? 's' : ''}? This action cannot be undone.
          </Text>
          <Text size="sm" c="dimmed">
            The following files will be permanently deleted:
          </Text>
          <ScrollArea h={200} type="hover">
            <Stack gap="xs">
              {Array.from(selectedFiles).map((fileId) => {
                const file = selectedFileData.get(fileId)
                return file ? (
                  <Text key={fileId} size="sm" c="dimmed">
                    • {file.file_name}
                  </Text>
                ) : (
                  <Text key={fileId} size="sm" c="dimmed">
                    • File ID: {fileId} (data not available)
                  </Text>
                )
              })}
            </Stack>
          </ScrollArea>
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDeleteModal} disabled={bulkLoading}>
              Cancel
            </Button>
            <Button color="red" onClick={handleBulkDelete} loading={bulkLoading}>
              Delete Files
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Mounted>
  )
}
