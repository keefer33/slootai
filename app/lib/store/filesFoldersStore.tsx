import { create } from 'zustand'
import { showNotification } from '../notificationUtils'
import { supabase } from '../utils'
import createUniversalSelectors from './universalSelectors'

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

interface PaginationData {
  data: FileData[]
  total: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface FilesFoldersState {
  // State
  files: FileData[]
  folders: Folder[]
  selectedFolderId: string | null
  paginationData: PaginationData
  loading: boolean
  gridLoading: boolean
  uploading: boolean
  error: string | null

  // Actions
  setFiles: (files: FileData[]) => void
  setFolders: (folders: Folder[]) => void
  setSelectedFolderId: (folderId: string | null) => void
  setPaginationData: (data: PaginationData) => void
  setLoading: (loading: boolean) => void
  setGridLoading: (loading: boolean) => void
  setUploading: (uploading: boolean) => void
  setError: (error: string | null) => void

  // Getters
  getFiles: () => FileData[]
  getFolders: () => Folder[]
  getSelectedFolderId: () => string | null
  getPaginationData: () => PaginationData
  getLoading: () => boolean
  getGridLoading: () => boolean
  getUploading: () => boolean
  getError: () => string | null

  // File operations
  uploadFile: (file: File, userId: string) => Promise<boolean>
  deleteFile: (fileId: string, filePath: string, userId: string) => Promise<boolean>
  updateFileName: (fileId: string, newFileName: string, userId: string) => Promise<{ success: boolean; updatedFile?: FileData }>
  moveFileToFolder: (fileId: string, folderId: string | null, userId: string) => Promise<{ success: boolean; file?: FileData }>
  saveFileFromUrl: (url: string, fileName: string | undefined, userId: string) => Promise<boolean>

  // Folder operations
  createFolder: (name: string, userId: string) => Promise<{ success: boolean; folder?: Folder }>
  updateFolder: (folderId: string, name: string, userId: string) => Promise<{ success: boolean; folder?: Folder }>
  deleteFolder: (folderId: string, userId: string) => Promise<{ success: boolean }>

  // Data loading
  loadUserFiles: (page?: number, limit?: number, folderId?: string | null, userId?: string) => Promise<PaginationData>
  loadUserFolders: (userId?: string) => Promise<Folder[]>

  // Utility functions
  refreshData: (userId: string) => Promise<void>
  reset: () => void
}

const useFilesFoldersStoreBase = create<FilesFoldersState>((set, get) => ({
  // Initial state
  files: [],
  folders: [],
  selectedFolderId: null,
  paginationData: {
    data: [],
    total: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  loading: false,
  gridLoading: false,
  uploading: false,
  error: null,

  // Basic setters
  setFiles: (files) => set({ files }),
  setFolders: (folders) => set({ folders }),
  setSelectedFolderId: (folderId) => set({ selectedFolderId: folderId }),
  setPaginationData: (data) => set({ paginationData: data }),
  setLoading: (loading) => set({ loading }),
  setGridLoading: (gridLoading) => set({ gridLoading }),
  setUploading: (uploading) => set({ uploading }),
  setError: (error) => set({ error }),

  // Getters
  getFiles: () => get().files,
  getFolders: () => get().folders,
  getSelectedFolderId: () => get().selectedFolderId,
  getPaginationData: () => get().paginationData,
  getLoading: () => get().loading,
  getGridLoading: () => get().gridLoading,
  getUploading: () => get().uploading,
  getError: () => get().error,

  // File operations
  uploadFile: async (file: File, userId: string) => {
    if (!userId) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return false
    }

    set({ uploading: true })
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error } = await supabase.storage.from('user-files').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
        return false
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from('user-files').getPublicUrl(filePath)

      // Save file metadata to database
      const { error: dbError } = await supabase.from('user_files').insert({
        user_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        public_url: urlData.publicUrl,
      })

      if (dbError) {
        showNotification({ title: 'Error', message: 'File uploaded but failed to save metadata', type: 'error' })
        return false
      }

      showNotification({ title: 'Success', message: 'File uploaded successfully', type: 'success' })
      return true
    } catch (error) {
      console.error('Error uploading file:', error)
      showNotification({ title: 'Error', message: 'Failed to upload file', type: 'error' })
      return false
    } finally {
      set({ uploading: false })
    }
  },

  deleteFile: async (fileId: string, filePath: string, userId: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage.from('user-files').remove([filePath])

      if (storageError) {
        showNotification({ title: 'Error', message: storageError.message, type: 'error' })
        return false
      }

      // Delete from database
      const { error: dbError } = await supabase.from('user_files').delete().eq('id', fileId).eq('user_id', userId)

      if (dbError) {
        showNotification({ title: 'Error', message: 'File deleted from storage but failed to remove from database', type: 'error' })
        return false
      }

      showNotification({ title: 'Success', message: 'File deleted successfully', type: 'success' })
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      showNotification({ title: 'Error', message: 'Failed to delete file', type: 'error' })
      return false
    }
  },

  updateFileName: async (fileId: string, newFileName: string, userId: string) => {
    if (!userId) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return { success: false }
    }

    try {
      // First, get the current file data from the reference table
      const { data: fileData, error: fetchError } = await supabase.from('user_files').select('file_path, file_name').eq('id', fileId).eq('user_id', userId).single()

      if (fetchError || !fileData) {
        showNotification({ title: 'Error', message: 'File not found', type: 'error' })
        return { success: false }
      }

      // Extract file extension from original name
      const originalExt = fileData.file_name.split('.').pop()
      const newExt = newFileName.split('.').pop()

      // Ensure the new filename has the same extension
      const finalFileName = newExt === originalExt ? newFileName : `${newFileName}.${originalExt}`

      // Create new file path with the user's desired filename (keeping the same user folder structure)
      const pathParts = fileData.file_path.split('/')
      const newFilePath = `${pathParts[0]}/${finalFileName}`

      // Move/rename the file in Supabase Storage using the move method
      const { error: moveError } = await supabase.storage.from('user-files').move(fileData.file_path, newFilePath)

      if (moveError) {
        showNotification({ title: 'Error', message: 'Failed to rename file in storage', type: 'error' })
        return { success: false }
      }

      // Get the new public URL
      const { data: urlData } = supabase.storage.from('user-files').getPublicUrl(newFilePath)

      // Update the reference table with new file name, path, and URL
      const { error: updateError } = await supabase
        .from('user_files')
        .update({
          file_name: finalFileName,
          file_path: newFilePath,
          public_url: urlData.publicUrl,
        })
        .eq('id', fileId)
        .eq('user_id', userId)

      if (updateError) {
        showNotification({ title: 'Error', message: 'Failed to update file record', type: 'error' })
        return { success: false }
      }

      showNotification({ title: 'Success', message: 'File name updated successfully', type: 'success' })

      // Return the updated file data
      const updatedFileData: FileData = {
        id: fileId,
        file_name: finalFileName,
        file_path: newFilePath,
        file_size: 0, // This will be updated by the caller
        file_type: '', // This will be updated by the caller
        public_url: urlData.publicUrl,
        created_at: '', // This will be updated by the caller
        folder_id: null,
      }

      return {
        success: true,
        updatedFile: updatedFileData,
      }
    } catch (error) {
      console.error('Error updating file name:', error)
      showNotification({ title: 'Error', message: 'Failed to update file name', type: 'error' })
      return { success: false }
    }
  },

  moveFileToFolder: async (fileId: string, folderId: string | null, userId: string) => {
    if (!userId) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return { success: false }
    }

    try {
      const { data, error } = await supabase
        .from('user_files')
        .update({
          folder_id: folderId,
        })
        .eq('id', fileId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
        return { success: false }
      }

      showNotification({ title: 'Success', message: 'File moved successfully', type: 'success' })
      return { success: true, file: data }
    } catch (error) {
      console.error('Error moving file:', error)
      showNotification({ title: 'Error', message: 'Failed to move file', type: 'error' })
      return { success: false }
    }
  },

  saveFileFromUrl: async (url: string, fileName: string | undefined, userId: string) => {
    if (!userId) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return false
    }

    try {
      // Fetch the file from the URL
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)
      }

      // Get the file blob
      const blob = await response.blob()

      // Determine file name from URL or use provided name
      const urlFileName = fileName || url.split('/').pop()?.split('?')[0] || 'downloaded-file'
      const fileExt = urlFileName.split('.').pop() || 'bin'
      const finalFileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${userId}/${finalFileName}`

      // Create a File object from the blob
      const file = new File([blob], urlFileName, { type: blob.type || 'application/octet-stream' })

      // Upload the actual file to Supabase storage
      const { error } = await supabase.storage.from('user-files').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
        return false
      }

      // Get the public URL
      const { data: urlData } = supabase.storage.from('user-files').getPublicUrl(filePath)

      // Save file metadata to database
      const { error: dbError } = await supabase.from('user_files').insert({
        user_id: userId,
        file_name: urlFileName,
        file_path: filePath,
        file_size: blob.size,
        file_type: blob.type || 'application/octet-stream',
        public_url: urlData.publicUrl,
      })

      if (dbError) {
        showNotification({ title: 'Error', message: 'File downloaded but failed to save metadata', type: 'error' })
        return false
      }

      showNotification({ title: 'Success', message: 'File downloaded and saved successfully', type: 'success' })
      return true
    } catch (error) {
      console.error('Error downloading file from URL:', error)
      showNotification({ title: 'Error', message: 'Failed to download file from URL', type: 'error' })
      return false
    }
  },

  // Folder operations
  createFolder: async (name: string, userId: string) => {
    if (!userId) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return { success: false }
    }

    try {
      const { data, error } = await supabase
        .from('user_folders')
        .insert({
          user_id: userId,
          name: name.trim(),
        })
        .select()
        .single()

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
        return { success: false }
      }

      showNotification({ title: 'Success', message: 'Folder created successfully', type: 'success' })
      return { success: true, folder: data }
    } catch (error) {
      console.error('Error creating folder:', error)
      showNotification({ title: 'Error', message: 'Failed to create folder', type: 'error' })
      return { success: false }
    }
  },

  updateFolder: async (folderId: string, name: string, userId: string) => {
    if (!userId) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return { success: false }
    }

    try {
      const { data, error } = await supabase
        .from('user_folders')
        .update({
          name: name.trim(),
        })
        .eq('id', folderId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        showNotification({ title: 'Error', message: error.message, type: 'error' })
        return { success: false }
      }

      showNotification({ title: 'Success', message: 'Folder updated successfully', type: 'success' })
      return { success: true, folder: data }
    } catch (error) {
      console.error('Error updating folder:', error)
      showNotification({ title: 'Error', message: 'Failed to update folder', type: 'error' })
      return { success: false }
    }
  },

  deleteFolder: async (folderId: string, userId: string) => {
    if (!userId) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return { success: false }
    }

    try {
      // First, move all files in this folder back to root (folder_id = null)
      const { error: moveError } = await supabase.from('user_files').update({ folder_id: null }).eq('folder_id', folderId).eq('user_id', userId)

      if (moveError) {
        showNotification({ title: 'Error', message: 'Failed to move files from folder', type: 'error' })
        return { success: false }
      }

      // Then delete the folder
      const { error: deleteError } = await supabase.from('user_folders').delete().eq('id', folderId).eq('user_id', userId)

      if (deleteError) {
        showNotification({ title: 'Error', message: 'Failed to delete folder', type: 'error' })
        return { success: false }
      }

      showNotification({ title: 'Success', message: 'Folder deleted successfully', type: 'success' })
      return { success: true }
    } catch (error) {
      console.error('Error deleting folder:', error)
      showNotification({ title: 'Error', message: 'Failed to delete folder', type: 'error' })
      return { success: false }
    }
  },

  // Data loading
  loadUserFiles: async (page = 1, limit = 12, folderId = null, userId?: string) => {
    if (!userId) {
      return { data: [], total: 0, totalPages: 0, currentPage: 1, hasNextPage: false, hasPrevPage: false }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase.from('user_files').select('*', { count: 'exact' }).eq('user_id', userId)

    if (folderId) {
      query = query.eq('folder_id', folderId)
    } else {
      query = query.is('folder_id', null)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)

    if (error) {
      showNotification({ title: 'Error', message: error.message, type: 'error' })
      return { data: [], total: 0, totalPages: 0, currentPage: 1, hasNextPage: false, hasPrevPage: false }
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    const paginationData = {
      data: data || [],
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }

    set({ paginationData })
    return paginationData
  },

  loadUserFolders: async (userId?: string) => {
    if (!userId) {
      return []
    }

    const { data, error } = await supabase.from('user_folders').select('*').eq('user_id', userId).order('name', { ascending: true })

    if (error) {
      showNotification({ title: 'Error', message: error.message, type: 'error' })
      return []
    }

    const folders = data || []
    set({ folders })
    return folders
  },

  // Utility functions
  refreshData: async (userId: string) => {
    const { selectedFolderId, paginationData } = get()
    await Promise.all([get().loadUserFiles(paginationData.currentPage, 12, selectedFolderId, userId), get().loadUserFolders(userId)])
  },

  reset: () =>
    set({
      files: [],
      folders: [],
      selectedFolderId: null,
      paginationData: {
        data: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      loading: false,
      gridLoading: false,
      uploading: false,
      error: null,
    }),
}))

export default createUniversalSelectors(useFilesFoldersStoreBase)
export type { FileData, FilesFoldersState, Folder, PaginationData }
