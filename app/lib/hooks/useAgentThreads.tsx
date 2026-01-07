import useAiStore from '../store/aiStore'
import useThreadsStore from '../store/threadsStore'

export default function useAgentThreads() {
  const { selectedModel } = useAiStore()
  const { getThreadMessages } = useThreadsStore()

  // Utility function to safely parse JSON content
  const safeJsonParse = (content: any, fallback: any = content) => {
    if (!content) return fallback

    try {
      // If content is already an object, return it
      if (typeof content === 'object' && content !== null) {
        return content
      }

      // If content is a string, try to parse it as JSON
      if (typeof content === 'string') {
        // Check if it looks like JSON
        const trimmed = content.trim()
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          return JSON.parse(content)
        }
      }

      return fallback
    } catch (error) {
      console.warn('Failed to parse JSON content:', error, 'Content:', content)
      return fallback
    }
  }

  const threadParserXai = (thread: any) => {
    const messages: any[] = []
    thread.forEach((nm) => {
      const message = {
        user: {},
        assistant: {},
        json: [],
        usage: {},
        fullMessage: nm.messages,
      }
      nm.messages.forEach((m) => {
        if (m.role === 'user') {
          message.user = {
            text: m.content[0].text,
            created_at: nm.created_at,
          }
        }

        if (m.role === 'assistant') {
          // Handle assistant messages with tool calls
          if (m.tool_calls && m.tool_calls.length > 0) {
            m.tool_calls.forEach((toolCall) => {
              message.json.push({
                json: { ...toolCall, arguments: JSON.parse(toolCall.function.arguments) },
                title: `Tool Call - ${toolCall.function.name}`,
              })
            })
          }

          if (m.citations) {
            message.json.push({
              json: m.citations,
              title: 'Citations',
            })
          }

          // Handle regular assistant text content
          if (m.content && m.content.length > 0) {
            message.assistant = {
              content: m.content,
            }
          }
        }

        if (m.role === 'tool') {
          message.json.push({
            json: { ...m, content: safeJsonParse(m.content, m.content) },
            title: `Tool Response - ${m.tool_call_id}`,
          })
        }
      })
      message.usage = nm.usage
      messages.push(message)
    })
    return messages
  }

  const threadParserOpenai = (thread: any) => {
    const messages: any[] = []
    thread.forEach((nm) => {
      const message = {
        user: {},
        assistant: {},
        json: [],
        usage: {},
        fullMessage: nm.messages,
      }
      nm.messages.forEach((m) => {
        if (m.role === 'user') {
          message.user = {
            text: m.content[0].text,
            created_at: nm.created_at,
          }
        }
        if (m.role === 'assistant') {
          message.assistant = {
            content: m.content[0].text,
          }
        }
        if (m.type === 'mcp_call') {
          const formattedMessage = {
            ...m,
            arguments: safeJsonParse(m.arguments, m.arguments),
            output: safeJsonParse(m.output, m.output),
          }
          message.json.push({
            json: formattedMessage,
            title: `${m.type} -  ${m.name}`,
          })
        }
        if (m.type === 'function_call') {
          const formattedMessage = {
            ...m,
            arguments: safeJsonParse(m.arguments, m.arguments),
          }
          message.json.push({
            json: formattedMessage,
            title: `${m.type} -  ${m.name}`,
          })
        }
        if (m.type === 'function_call_output') {
          const formattedMessage = {
            ...m,
            output: safeJsonParse(m.output, m.output),
          }
          message.json.push({
            json: formattedMessage,
            title: `${m.type}`,
          })
        }
        if (m.type === 'mcp_list_tools') {
          message.json.push({
            json: m,
            title: `${m.type} - ${m.server_label}`,
          })
        }
        message.usage = nm.usage
      })
      messages.push(message)
    })
    return messages
  }

  const threadParserAnthropic = (thread: any) => {
    const messages: any[] = []
    thread.forEach((nm) => {
      const message = {
        user: {},
        assistant: {
          content: '',
        },
        json: [],
        usage: {},
        fullMessage: nm.messages,
      }
      nm.messages.forEach((m) => {
        if (m.role === 'user') {
          if (m.content[0].type === 'tool_result') {
            const formattedMessage = {
              ...m,
              content: safeJsonParse(m.content[0].content, m.content[0].content),
            }
            message.json.push({
              json: formattedMessage,
              title: `${m.content[0].type}`,
            })
          } else {
            message.user = {
              text: m.content[0].text,
              created_at: nm.created_at,
            }
          }
        }
        if (m.role === 'assistant') {
          m.content.forEach((c) => {
            if (c.type === 'tool_use') {
              message.json.push({
                json: c,
                title: `${c.type}`,
              })
            }
            if (c.type === 'tool_result') {
              const formattedMessage = {
                ...c,
                content: safeJsonParse(c.content, c.content),
              }
              message.json.push({
                json: formattedMessage,
                title: `${c.type}`,
              })
            }
            if (c.type === 'text') {
              message.assistant.content = message.assistant.content + c.text
            }
            if (c.type === 'mcp_tool_use') {
              message.json.push({
                json: c,
                title: `${c.type}`,
              })
            }
            if (c.type === 'mcp_tool_result') {
              const formattedMessage = {
                ...c,
                content: [
                  {
                    type: 'text',
                    text: safeJsonParse(c.content[0].text, c.content[0].text),
                  },
                ],
              }
              message.json.push({
                json: formattedMessage,
                title: `${c.type}`,
              })
            }
            if (c.type === 'server_tool_use') {
              message.json.push({
                json: c,
                title: `${c.type}`,
              })
            }
            if (c.type === 'web_search_tool_result') {
              message.json.push({
                json: c,
                title: `${c.type}`,
              })
            }
          })
        }
        if (m.role === 'tool') {
          message.json.push({
            json: safeJsonParse(m.content[0].content, m.content[0].content),
            title: `${m.content.type}`,
          })
        }
      })
      message.usage = nm.usage
      messages.push(message)
    })
    return messages
  }

  const threadParserGoogle = (thread: any) => {
    const messages: any[] = []
    thread.forEach((nm) => {
      const message = {
        user: {},
        assistant: {},
        json: [],
        usage: {},
        fullMessage: nm.messages,
      }
      nm.messages.forEach((m) => {
        if (m.role === 'user') {
          m.parts?.forEach((part) => {
            if (part.text && part.text.length > 0) {
              message.user = {
                text: part.text,
                created_at: nm.created_at,
              }
            }
            if (part.functionResponse) {
              message.json.push({
                json: part.functionResponse,
                title: `Function Response - ${part.functionResponse.name}`,
              })
            }
          })
        }

        if (m.role === 'model') {
          m.parts?.forEach((part) => {
            if (part.text && part.text.length > 0) {
              message.assistant = {
                content: part.text,
                created_at: nm.created_at,
              }
            }
            if (part.functionCall) {
              message.json.push({
                json: part.functionCall,
                title: `Function Call - ${part.functionCall.name}`,
              })
            }
          })
        }
      })
      message.usage = nm.usage
      messages.push(message)
    })
    return messages
  }

  const getMessagesByBrand = () => {
    switch (selectedModel.brand.toLowerCase()) {
      case 'anthropic':
        return threadParserAnthropic(getThreadMessages())
        break
      /*
      case 'google':
        console.log(threadParserGoogle(getSelectedThread().thread_messages))
        return threadParserGoogle(getSelectedThread().thread_messages)
        break
        */
      case 'openai':
        return threadParserOpenai(getThreadMessages())
        break
      default:
        return threadParserXai(getThreadMessages())
        break
    }
  }

  // Create cumulative summary from all messages
  const createCumulativeMessage = () => {
    const messages = getMessagesByBrand()
    if (messages.length <= 1) return null

    const cumulativeMessage = {
      usage: [] as any[],
      json: [] as any[],
      fullMessage: [] as any[],
    }

    messages.forEach((message) => {
      if (message.usage) {
        cumulativeMessage.usage.push(...message.usage)
      }
      if (message.json) {
        cumulativeMessage.json.push(...message.json)
      }
      if (message.fullMessage) {
        cumulativeMessage.fullMessage.push(...message.fullMessage)
      }
    })

    return cumulativeMessage
  }

  return {
    threadParserXai,
    threadParserOpenai,
    threadParserAnthropic,
    threadParserGoogle,
    getMessagesByBrand,
    createCumulativeMessage,
  }
}
