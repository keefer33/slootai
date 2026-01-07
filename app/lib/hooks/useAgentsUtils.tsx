import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import useThreadsStore from '~/lib/store/threadsStore'
import useToolsStore from '~/lib/store/toolsStore'

// @refresh reset
// Custom hook - not a React component
export default function useAgentUtils() {
  const { api, selectedModel, setSelectedModel, setSelectedAgent, setResponseId, responseId, getSelectedModel, selectedAgent, getSelectedAgent, setLoading } = useAiStore()
  const {
    getThreadMessages,
    getSelectedThread,
    setLiveStreamContent,
    setIsStreaming,
    setShowHistory,
    setStreamingMode,
    setUserMessage,
    setThreadMessages,
    setThreads,
    setSelectedThread,
    setLiveStreamUpdates,
  } = useThreadsStore()
  const { slootTools } = useToolsStore()

  const getAgentAttachedTools = async (agentId: string) => {
    const { data, error } = await api
      .from('user_model_tools')
      .select(
        `
          id,
          user_model_id,
          user_tool_id,
          tool:user_tools(*)
        `,
      )
      .eq('user_model_id', agentId)

    if (error) {
      console.error('Error loading attached tools:', error)
      return []
    }

    data.map((tool, index) => {
      if (!tool.tool) {
        data[index].tool = slootTools.find((t) => t.id === tool.user_tool_id)
      }
    })
    return data || []
  }

  const getDefaultValues = () => {
    const defaultValues = getSelectedModel()?.forms?.reduce((acc, form) => {
      // Only set default values for required fields
      if (!form.toggle) {
        // Convert checkbox default values to boolean
        if (form.type === 'checkbox') {
          acc[form.name] = Boolean(form.defaultValue)
        } else if (form.type === 'number' || form.type === 'slider') {
          // Convert number default values to actual numbers
          acc[form.name] = form.defaultValue !== null && form.defaultValue !== undefined ? Number(form.defaultValue) : form.defaultValue
        } else {
          acc[form.name] = form.defaultValue
        }
      }
      return acc
    }, {})
    return { ...defaultValues, model: getSelectedModel()?.model }
  }

  const savePayload = async (values) => {
    // Transform MCP servers for OpenAI format
    const newSettings: any = {}

    newSettings.mcp_servers = [...getSelectedAgent()?.settings.mcp_servers]
    newSettings.pipedream = getSelectedAgent().settings.pipedream
    newSettings.tools = []
    // Get attached user tools
    const attachedTools = await getAgentAttachedTools(getSelectedAgent().id)
    attachedTools.map((attachment) => {
      newSettings.tools.push(attachment.tool.id)
    })

    const payload: any = {
      ...values,
      ...newSettings,
    }
    if (responseId) {
      payload.config.previous_response_id = responseId
    }
    const { error } = await api.from('user_models').update({ settings: payload }).eq('id', selectedAgent.id)
    if (error) {
      showNotification({ title: 'Error', message: error.message, type: 'error' })
    } else {
      await refreshSelectedAgent(selectedAgent.id)
    }
  }

  function createPayload(payload: any, isCode: boolean = false) {
    let finalConfig: any = {}
    let newMessage: any = {}
    let files: any = []
    let prompt: any = {}
    switch (selectedModel.brand?.toLowerCase()) {
      case 'anthropic':
        files =
          selectedAgent.settings?.files?.map((file) => {
            if (file?.type?.toLowerCase().includes('image')) {
              return { type: 'image', source: { type: 'url', url: file.url } }
            }
            return { type: 'document', source: { type: 'url', url: file.url } }
          }) || []
        prompt = { type: 'text', text: payload.prompt }
        newMessage = { role: 'user', content: [prompt, ...files] }
        if (!isCode) {
          setUserMessage(newMessage)
          // Start fresh with new user message
          setThreadMessages([...getThreadMessages(), newMessage])
        }
        finalConfig = { prompt: payload.prompt, files: selectedAgent.settings?.files, thread_id: getSelectedThread()?.id || '', agent_id: selectedAgent.id }
        break
      case 'openai':
        files =
          selectedAgent.settings?.files?.map((file) => {
            if (file?.type?.toLowerCase().includes('image')) {
              return { type: 'input_image', image_url: file.url }
            }
            return { type: 'input_file', file_url: file.url }
          }) || []
        prompt = { type: 'input_text', text: payload.prompt }
        newMessage = { role: 'user', content: [prompt, ...files] }
        if (!isCode) {
          setUserMessage(newMessage)
          // Start fresh with new user message
          setThreadMessages([...getThreadMessages(), newMessage])
        }
        finalConfig = { prompt: payload.prompt, files: selectedAgent.settings?.files, thread_id: getSelectedThread()?.id || '', agent_id: selectedAgent.id }
        break
      case 'xai':
        files =
          selectedAgent.settings?.files?.map((file) => {
            return { type: 'image_url', image_url: { url: file.url } }
          }) || []
        prompt = { type: 'text', text: payload.prompt }
        newMessage = { role: 'user', content: [prompt, ...files] }
        if (!isCode) {
          setUserMessage(newMessage)
          // Start fresh with new user message
          setThreadMessages([...getThreadMessages(), newMessage])
        }
        finalConfig = { prompt: payload.prompt, files: selectedAgent.settings?.files, thread_id: getSelectedThread()?.id || '', agent_id: selectedAgent.id }
        break
      default:
        files =
          selectedAgent.settings?.files?.map((file) => {
            if (file?.type?.toLowerCase().includes('image')) {
              return { type: 'input_image', image_url: file.url }
            }
            return { type: 'input_file', file_url: file.url }
          }) || []
        prompt = { type: 'text', text: payload.prompt }
        newMessage = { role: 'user', content: [prompt, ...files] }
        if (!isCode) {
          setUserMessage(newMessage)
          // Start fresh with new user message
          setThreadMessages([...getThreadMessages(), newMessage])
        }
        finalConfig = { prompt: payload.prompt, files: selectedAgent.settings?.files, thread_id: getSelectedThread()?.id || '', agent_id: selectedAgent.id }
        break
    }

    return finalConfig
  }

  const resetPayload = () => {
    //setThreadMessages([])
    setUserMessage(null)
    setLoading(false)
    setLiveStreamContent('')
    setLiveStreamUpdates(null)
  }

  const refreshSelectedAgent = async (agentId: string) => {
    const { data, error } = await api.from('user_models').select('*').eq('id', agentId).single()

    if (error) {
      showNotification({ title: 'Error', message: error.message, type: 'error' })
      return
    } else {
      setSelectedAgent(data)
    }
  }

  const resetAgent = () => {
    setSelectedModel(null)
    setSelectedAgent(null)
    setThreadMessages([])
    setSelectedThread(null)
    setThreads([])
    setResponseId(null)
    setLiveStreamContent('')
    setLiveStreamUpdates(null)
    setIsStreaming(false)
    setShowHistory(false)
    setStreamingMode(null)
    setUserMessage(null)
  }

  return {
    getDefaultValues,
    resetAgent,
    getAgentAttachedTools,
    createPayload,
    savePayload,
    resetPayload,
    refreshSelectedAgent,
  }
}
