import { create } from 'zustand'
import { showError, supabase } from '../utils'
import createUniversalSelectors from './universalSelectors'

interface ThreadMessage {
  id: string
  content: string | any[] | null
  role: 'user' | 'assistant' | 'system'
  created_at?: string | Date | null
  updated_at?: string | null
  thread_id?: string
}

interface Thread {
  id: string
  title: string
  created_at?: string | Date | null
  updated_at?: string | null
  user_id?: string | null
  agent_id?: string | null
  messages?: ThreadMessage[] | null
}

interface ThreadsState {
  // State
  selectedThread: Thread | null
  threads: Thread[] | null
  threadMessages: ThreadMessage[]
  liveStreamContent: string
  liveStreamUpdates: any | null
  isStreaming: boolean
  streamingMode: 'streaming' | 'non-streaming' | null
  showHistory: boolean
  userMessage: string | null | ThreadMessage
  responseId: string | null

  // Actions
  setSelectedThread: (thread: Thread | null) => void
  setThreads: (threads: Thread[] | null) => void
  setThreadMessages: (messages: ThreadMessage[]) => void
  setLiveStreamContent: (content: string) => void
  setLiveStreamUpdates: (updates: any | null) => void
  setIsStreaming: (isStreaming: boolean) => void
  setStreamingMode: (mode: 'streaming' | 'non-streaming' | null) => void
  setShowHistory: (show: boolean) => void
  setUserMessage: (message: string | null | ThreadMessage) => void
  setResponseId: (id: string | null) => void

  // Getters
  getSelectedThread: () => Thread | null
  getThreads: () => Thread[] | null
  getThreadMessages: () => ThreadMessage[]
  getAllThreadMessages: () => ThreadMessage[]
  getLiveStreamContent: () => string
  getLiveStreamUpdates: () => {} | null
  getIsStreaming: () => boolean
  getStreamingMode: () => 'streaming' | 'non-streaming' | null
  getShowHistory: () => boolean
  getUserMessage: () => string | null | ThreadMessage | any
  getResponseId: () => string | null

  // Utility functions
  loadThreadMessages: (threadId: string) => Promise<ThreadMessage[] | null>
  getThreadById: (threadId: string) => Promise<Thread | null>
  getThreadsByModelId: (modelId: string) => Promise<Thread[] | null>
  handleThreads: (thread_id: string, modelId: string) => Promise<void>
  getLastThreadMessage: (threadId: string) => Promise<ThreadMessage | null>
  loadThreadHistory: () => Promise<void>
  deleteThread: (threadId: string, agentId: string) => Promise<void>
  deleteAllThreads: (agentId: string) => Promise<boolean>
  clearThread: () => void
}

const useThreadsStoreBase = create<ThreadsState>((set, get) => ({
  // Initial state
  selectedThread: null,
  threads: null,
  threadMessages: [],
  liveStreamContent: '',
  liveStreamUpdates: null,
  isStreaming: false,
  streamingMode: null,
  showHistory: false,
  userMessage: null,
  responseId: null,

  // Basic setters
  setSelectedThread: (thread) => set({ selectedThread: thread }),
  setThreads: (threads) => set({ threads }),
  setThreadMessages: (messages) => set({ threadMessages: messages }),
  setLiveStreamContent: (content) => set({ liveStreamContent: content }),
  setLiveStreamUpdates: (updates) => set({ liveStreamUpdates: updates }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingMode: (mode) => set({ streamingMode: mode }),
  setShowHistory: (show) => set({ showHistory: show }),
  setUserMessage: (message) => set({ userMessage: message }),
  setResponseId: (id) => set({ responseId: id }),

  // Getters
  getSelectedThread: () => get().selectedThread,
  getThreads: () => get().threads,
  getThreadMessages: () => get().threadMessages,
  getAllThreadMessages: () => get().threadMessages,
  getLiveStreamContent: () => get().liveStreamContent,
  getLiveStreamUpdates: () => get().liveStreamUpdates,
  getIsStreaming: () => get().isStreaming,
  getStreamingMode: () => get().streamingMode,
  getShowHistory: () => get().showHistory,
  getUserMessage: () => get().userMessage as string | null | ThreadMessage,
  getResponseId: () => get().responseId,

  loadThreadMessages: async (threadId: string) => {
    const { data, error } = await supabase.from('thread_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true })
    if (error) {
      showError(error)
      return null
    }
    set({ threadMessages: data || [] })
    return data || []
  },

  getLastThreadMessage: async (threadId: string) => {
    const { data, error } = await supabase.from('thread_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: false }).limit(1)
    if (error) {
      showError(error)
      return null
    }
    set({ threadMessages: data.length > 0 ? [data[0]] : [] })
    return data.length > 0 ? data[0] : null
  },

  getThreadById: async (threadId: string) => {
    const { data, error } = await supabase.from('threads').select('*').eq('id', threadId).single()
    if (error) {
      console.error('Error fetching thread by id:', error)
      showError(error)
      return null
    }
    set({ selectedThread: data })
    return data
  },

  getThreadsByModelId: async (modelId: string) => {
    const { data: threads, error: threadError } = await supabase.from('threads').select('*').eq('model_id', modelId).order('created_at', { ascending: false })

    // Check for errors in retrieving threads
    if (threadError) {
      showError(threadError)
      return null
    }
    set({ threads: threads || [] })
    return threads || []
  },

  handleThreads: async (thread_id: string, modelId: string) => {
    await get().getThreadById(thread_id)
    await get().getThreadsByModelId(modelId)
    await get().getLastThreadMessage(thread_id)
    set({ userMessage: null })
    set({ liveStreamContent: '' })
    set({ showHistory: true })
  },

  loadThreadHistory: async () => {
    const selectedThread = get().getSelectedThread()
    if (!selectedThread?.id) {
      console.error('No selected thread found')
      return
    }
    await get().loadThreadMessages(selectedThread.id)
    // Update thread messages and show history
    set({ userMessage: null })
    set({ liveStreamContent: '' })
    set({ liveStreamUpdates: null })
    set({ showHistory: true })
  },

  // Utility functions
  deleteThread: async (threadId: string, agentId: string) => {
    const { error } = await supabase.from('threads').delete().eq('id', threadId)
    if (error) {
      showError(error)
      return
    }

    // Refresh threads list
    await get().getThreadsByModelId(agentId)

    // If we deleted the currently selected thread, clear it
    if (get().getSelectedThread()?.id === threadId) {
      set({ threadMessages: [] })
      set({ selectedThread: null })
      set({ responseId: null })
    }
  },

  deleteAllThreads: async (agentId: string) => {
    if (!get().threads || get().threads.length === 0) return false

    const threadIds = get().threads.map((thread) => thread.id)
    const { error } = await supabase.from('threads').delete().in('id', threadIds)

    if (error) {
      console.error('Error deleting all threads:', error)
      showError(error)
      return false
    }

    // Clear current thread state
    get().clearThread()

    // Refresh threads list (should be empty now)
    await get().getThreadsByModelId(agentId)
    return true
  },

  clearThread: () =>
    set({
      selectedThread: null,
      threadMessages: [],
      liveStreamContent: '',
      liveStreamUpdates: null,
      isStreaming: false,
      streamingMode: null,
      showHistory: false,
      userMessage: null,
      responseId: null,
    }),
}))

export default createUniversalSelectors(useThreadsStoreBase)
export type { Thread, ThreadMessage, ThreadsState }
