import axios from 'axios'
import { showNotification } from '../notificationUtils'
import useAiStore from '../store/aiStore'
import useThreadsStore from '../store/threadsStore'
import { endpoint } from '../utils'

interface ErrorWithPayload extends Error {
  errorPayload?: any
}

export default function useAgentPrompt() {
  const { selectedModel, getAuthToken } = useAiStore()
  const { setIsStreaming, setLiveStreamContent, setLiveStreamUpdates } = useThreadsStore()

  const processResponse = async (payload: any) => {
    try {
      setLiveStreamUpdates({ type: 'start', status: 'Processing response...' })
      const data = await axios.post(`${endpoint}${selectedModel.api_url}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })
      setLiveStreamUpdates({ type: 'done', status: 'Response completed' })
      if (data.data.success === false) {
        return { success: false, error: data.data.error, message: data.data.message }
      }

      let assistantContent = ''
      switch (selectedModel.brand?.toLowerCase()) {
        case 'anthropic':
          assistantContent = handleAnthropicResponse(data.data)
          break
        case 'xai':
          assistantContent = handleXaiResponse(data.data)
          break
        /*
        case 'google':
          assistantContent = handleGoogleResponse(data.data)
          break
          */
        default:
          assistantContent = handleOpenAIResponse(data.data)
          break
      }
      setLiveStreamContent(assistantContent)
      return { success: true, data: data.data, assistantContent }
    } catch (error) {
      return { success: false, error: error.response.data.error, message: error.response.data.message }
    }
  }

  // OpenAI-specific response handler
  const handleOpenAIResponse = (data: any) => {
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content
    }
    if (data.output_text) {
      return data.output_text
    }
    if (data.content) {
      return data.content
    }
    if (data.text) {
      return data.text
    }
    return 'No response content available'
  }

  // Anthropic-specific response handler
  const handleAnthropicResponse = (data: any) => {
    if (data.data?.content?.[0]?.text) {
      return data.data.content[0].text
    }
    if (data.data?.text) {
      return data.data.text
    }
    if (data.content && Array.isArray(data.content)) {
      return data.content
        .filter((item: any) => item.type === 'text' && item.text)
        .map((item: any) => item.text)
        .join('\n\n')
    }
    if (data.text) {
      return data.text
    }
    return 'No response content available'
  }

  // Google/Gemini-specific response handler
  const handleGoogleResponse = (data: any) => {
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text
    }
    if (data.candidates && data.candidates[0]?.content?.text) {
      return data.candidates[0].content.text
    }
    if (data.text) {
      return data.text
    }
    if (data.content) {
      return data.content
    }
    return 'No response content available'
  }

  const handleXaiResponse = (data: any) => {
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content
    }
    if (data.output_text) {
      return data.output_text
    }
    if (data.content) {
      return data.content
    }
    if (data.text) {
      return data.text
    }
    return 'No response content available'
  }

  const processStream = async (payload: any) => {
    let lastChunk = null
    let assistantContent = ''
    setIsStreaming(true)

    try {
      setLiveStreamUpdates({ type: 'start', status: 'Stream started' })
      const response = await fetch(`${endpoint}${selectedModel.api_url}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        // Try to parse the error response body
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorData = { error: response.statusText || 'Unknown error' }
        }

        // Use the parsed error data
        const errorMessage = errorData.message || errorData.error || 'Unknown error'
        const errorWithPayload = new Error(errorMessage) as ErrorWithPayload
        errorWithPayload.errorPayload = errorData
        throw errorWithPayload
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // Split by double newlines to get complete SSE events
        const events = buffer.split('\n\n')
        buffer = events.pop() || '' // Keep incomplete event in buffer

        events.forEach((event) => {
          if (event.trim()) {
            const lines = event.split('\n')
            let data = ''

            // Find the data line
            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                data = line.substring(6).trim() // Remove 'data: ' prefix
              }
            })

            if (data) {
              try {
                const chunk = JSON.parse(data)
                lastChunk = chunk

                // Handle different message types
                switch (chunk.type) {
                  case 'connection':
                    setLiveStreamUpdates({ type: 'connection', status: 'Connected to stream' })
                    break

                  case 'updates':
                    setLiveStreamUpdates(chunk.text)
                    break

                  case 'text':
                    if (chunk.text) {
                      assistantContent += chunk.text
                      setLiveStreamContent(assistantContent)
                    }
                    break

                  case 'error':
                    console.error('❌ Server error:', chunk.text)
                    throw new Error(chunk.text || 'Unknown server error')
                }

                // Handle legacy error format
                if (chunk.error) {
                  throw new Error(chunk.error)
                }
              } catch (parseError) {
                console.error('❌ Error parsing chunk:', parseError, 'Raw data:', data)
                const parsedData = JSON.parse(data)
                showNotification({ title: 'Error', message: parsedData.text, type: 'error' })
              }
            }
          }
        })
      }
      setLiveStreamUpdates({ type: 'done', status: 'Stream completed' })
      setIsStreaming(false)
      return { success: true, data: lastChunk, assistantContent }
    } catch (error) {
      console.error('❌ Stream error:', error)
      setIsStreaming(false)
      const errorWithPayload = error as ErrorWithPayload
      return {
        success: false,
        error: errorWithPayload.errorPayload?.error || error.message || 'Stream Error',
        message: errorWithPayload.errorPayload?.message || error.message || 'Unknown error occurred',
      }
    }
  }

  return {
    handleOpenAIResponse,
    handleAnthropicResponse,
    handleGoogleResponse,
    handleXaiResponse,
    processResponse,
    processStream,
  }
}
