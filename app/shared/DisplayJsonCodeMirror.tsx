import { json } from '@codemirror/lang-json'
import { unifiedMergeView } from '@codemirror/merge'
import { oneDark } from '@codemirror/theme-one-dark'
import { Box, Button, Group, Stack, Text } from '@mantine/core'
import { RiMagicLine } from '@remixicon/react'
import CodeMirror from '@uiw/react-codemirror'
import { basicSetup, EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'

interface DisplayJsonCodeMirrorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string | null
  height?: string
  showFormatButton?: boolean
  originalValue?: string
  showDiff?: boolean
  readOnly?: boolean
  onAcceptChanges?: () => void
  onDeclineChanges?: () => void
  showTitle?: boolean
}

export function DisplayJsonCodeMirror({
  value,
  onChange,
  placeholder = '',
  error = null,
  height = 'auto',
  showFormatButton = true,
  originalValue,
  showDiff = false,
  readOnly = false,
  showTitle = true,
  onAcceptChanges,
  onDeclineChanges,
}: DisplayJsonCodeMirrorProps) {
  const [internalValue, setInternalValue] = useState(() => {
    // Ensure value is always a string
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  })
  const [formatError, setFormatError] = useState<string | null>(null)
  const [isFormatting, setIsFormatting] = useState(false)
  const mergeViewRef = useRef<HTMLDivElement>(null)
  const { formatJson, getAuthToken } = useAiStore()

  useEffect(() => {
    // Ensure value is always a string when updating
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    setInternalValue(stringValue)
  }, [value])

  // Create merge view when showDiff is true
  useEffect(() => {
    if (showDiff && mergeViewRef.current && originalValue) {
      // Clear the container
      mergeViewRef.current.innerHTML = ''

      // Create the unified merge view (GitHub-style diff)
      const view = new EditorView({
        parent: mergeViewRef.current,
        doc: internalValue,
        extensions: [
          basicSetup,
          json(),
          oneDark,
          unifiedMergeView({
            original: originalValue,
          }),
        ],
      })

      // Store the view reference so we can access the final state
      if (mergeViewRef.current) {
        ;(mergeViewRef.current as any).editorView = view
      }
    }
  }, [showDiff, originalValue, internalValue])

  const handleChange = (val: string) => {
    setInternalValue(val)
    setFormatError(null)
    onChange(val)
  }

  const formatJsonMethod = async () => {
    try {
      setIsFormatting(true)
      setFormatError(null)

      // Call the JSON formatter API
      const data = await formatJson(internalValue, getAuthToken())

      if (data.success && data.formattedJson) {
        setInternalValue(data.formattedJson)
        onChange(data.formattedJson)
        setFormatError(null)
      } else {
        setFormatError('Failed to format JSON')
      }
    } catch (error) {
      console.error('JSON formatting error:', error)
      setFormatError('Failed to format JSON. Please check your connection and try again.')
    } finally {
      setIsFormatting(false)
    }
  }

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString)
      return true
    } catch {
      return false
    }
  }

  const isJsonValid = validateJson(internalValue)

  // Function to get the final state from the merge view
  const getFinalStateFromMergeView = (): string | null => {
    if (mergeViewRef.current && (mergeViewRef.current as any).editorView) {
      const view = (mergeViewRef.current as any).editorView
      return view.state.doc.toString()
    }
    return null
  }

  // Handle accept changes with current merge view state
  const handleAcceptChanges = () => {
    if (onAcceptChanges) {
      // Get the current state from the merge view (after user's individual accept/decline actions)
      const currentState = getFinalStateFromMergeView()
      if (currentState) {
        // Update the internal value to reflect the current merge view state
        setInternalValue(currentState)
        onChange(currentState)
      }
      onAcceptChanges()
    }
  }

  return (
    <Stack gap="xs" w="100%">
      {showDiff ? (
        <Group justify="space-between" mb="xs" p="xs">
          <Text size="xs" fw={600}>
            ✨ Schema Changes (GitHub-style Unified Diff)
          </Text>
          {(onAcceptChanges || onDeclineChanges) && (
            <Group gap="xs">
              {onAcceptChanges && (
                <Button size="xs" variant="light" color="green" onClick={handleAcceptChanges}>
                  Accept All Changes
                </Button>
              )}
              {onDeclineChanges && (
                <Button size="xs" variant="light" color="red" onClick={onDeclineChanges}>
                  Decline All Changes
                </Button>
              )}
            </Group>
          )}
        </Group>
      ) : (
        <Group justify="space-between" align="center" p="0">
          <Text size="sm" fw={500}>
            {showTitle ? (readOnly ? 'JSON Editor (Read-only)' : 'JSON Editor') : ''}
          </Text>

          <Group gap="xs">
            {(error || formatError) && (
              <Text size="xs" c="red">
                {error || formatError || 'JSON is not valid'}
              </Text>
            )}

            {!readOnly && !error && !formatError && !isJsonValid && internalValue.trim() && (
              <Text size="xs" c="orange">
                JSON is not valid. Click &quot;AI Format JSON&quot; to attempt automatic fixes.
              </Text>
            )}

            {!readOnly && isJsonValid && internalValue.trim() && (
              <Text size="xs" c="green">
                ✓ Valid JSON
              </Text>
            )}

            {showFormatButton && !readOnly && (
              <Button size="xs" variant="light" leftSection={<RiMagicLine size={14} />} onClick={formatJsonMethod} disabled={!internalValue.trim() || isFormatting}>
                {isFormatting ? 'AI Formatting...' : 'AI Format JSON'}
              </Button>
            )}
          </Group>
        </Group>
      )}

      <Box
        p="0"
        style={{
          //border: error || formatError ? '1px solid var(--mantine-color-red-6)' : '1px solid var(--mantine-color-gray-3)',
          //borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {showDiff ? (
          <Box>
            <div
              ref={mergeViewRef}
              style={{
                height: `calc(${height} - 60px)`,
                fontSize: '14px',
                fontFamily: 'monospace',
                overflow: 'auto',
                //border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: '4px',
              }}
            />
          </Box>
        ) : (
          <CodeMirror
            value={internalValue}
            height={`calc(${height} - 20px)`}
            extensions={[json()]}
            theme={oneDark}
            onChange={readOnly ? undefined : handleChange}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          />
        )}
      </Box>
    </Stack>
  )
}
