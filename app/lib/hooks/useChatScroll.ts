import { useEffect, useRef } from 'react'
import useAiStore from '~/lib/store/aiStore'

/**
 * Custom hook for handling chat scrolling behavior
 *
 * @param options Configuration options
 * @returns Object containing viewport ref and scroll utility functions
 */
export function useChatScroll() {
  const {
    threadMessages,

    loading,
  } = useAiStore()
  const dependencies = [loading, threadMessages]
  const viewport = useRef<HTMLDivElement>(null)

  // Scroll to bottom when dependencies change
  useEffect(() => {
    scrollToBottom()
  }, dependencies)

  // Scroll to bottom of the chat
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth', delay: number = 0) => {
    if (delay > 0) {
      setTimeout(() => {
        performScroll(behavior)
      }, delay)
    } else {
      performScroll(behavior)
    }
  }

  // Scroll to top of the chat
  const scrollToTop = (behavior: ScrollBehavior = 'smooth', delay: number = 0) => {
    if (delay > 0) {
      setTimeout(() => {
        performScrollToTop(behavior)
      }, delay)
    } else {
      performScrollToTop(behavior)
    }
  }

  // Helper function to perform the actual scrolling to bottom
  const performScroll = (behavior: ScrollBehavior = 'smooth') => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight + 100,
        behavior,
      })
    }
  }

  // Helper function to perform the actual scrolling to top
  const performScrollToTop = (behavior: ScrollBehavior = 'smooth') => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: 0,
        behavior,
      })
    }
  }

  return {
    viewport,
    scrollToBottom,
    scrollToTop,
  }
}
