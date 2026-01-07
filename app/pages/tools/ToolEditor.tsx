import { Box, Text } from '@mantine/core'
import { useEffect } from 'react'
import { useParams } from 'react-router'
import useAiStore from '~/lib/store/aiStore'
import useToolsStore from '~/lib/store/toolsStore'
import { DisplayJsonCodeMirror } from '~/shared/DisplayJsonCodeMirror'

export default function ToolEditor() {
  const params = useParams()
  const { toolId } = params
  const { isAdmin, user } = useAiStore()

  const {
    selectedTool,
    isSlootTool,
    // Tool Editor actions
    setSchemaChanges,
    // Tool Editor operations
    initializeToolEditor,
    handleAcceptSchema,
    handleDeclineSchema,
    // Getters
    getShowSchemaDiff,
    getPendingSchema,
    getSchemaChanges,
  } = useToolsStore()

  const init = async () => {
    if (toolId && user?.id) {
      await initializeToolEditor(toolId, isAdmin, user.id)
    }
  }

  useEffect(() => {
    init()
  }, [toolId, isAdmin, user?.id])

  const handleSchemaChange = (newSchema: string) => {
    setSchemaChanges(newSchema)
  }

  const handleAcceptSchemaWrapper = async () => {
    if (!user?.id) return
    await handleAcceptSchema(user.id)
  }

  if (!selectedTool) {
    return (
      <Box p="xs">
        <Text>Tool not found</Text>
      </Box>
    )
  }

  return (
    <DisplayJsonCodeMirror
      key={selectedTool.id} // Force re-render when tool changes
      value={
        getShowSchemaDiff() && getPendingSchema()
          ? JSON.stringify(getPendingSchema(), null, 2)
          : getSchemaChanges() || (typeof selectedTool.schema === 'string' ? selectedTool.schema : JSON.stringify(selectedTool.schema || {}, null, 2))
      }
      onChange={getShowSchemaDiff() || isSlootTool ? () => {} : handleSchemaChange}
      placeholder='{"type": "object", "properties": {...}, "required": [...]}'
      height="calc(100vh - 110px)"
      originalValue={
        getShowSchemaDiff()
          ? selectedTool?.schema
            ? typeof selectedTool.schema === 'string'
              ? selectedTool.schema
              : JSON.stringify(selectedTool.schema, null, 2)
            : '{}'
          : undefined
      }
      showDiff={getShowSchemaDiff()}
      readOnly={isSlootTool}
      onAcceptChanges={handleAcceptSchemaWrapper}
      onDeclineChanges={handleDeclineSchema}
    />
  )
}
