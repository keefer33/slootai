import { Button, Group, Modal, Stack, Switch, Text, TextInput } from '@mantine/core'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import { showNotification } from '~/lib/notificationUtils'
import useToolsStore from '~/lib/store/toolsStore'
import { ApiConnectionManager } from '~/shared/ApiConnectionManager'
import { DisplayJsonCodeMirror } from '~/shared/DisplayJsonCodeMirror'

interface Tool {
  id: string
  user_id?: string
  tool_name: string
  schema: object | null | any
  avatar?: string
  is_sloot?: boolean
  created_at: string
  updated_at: string
  messages?: any[]
  response_id?: string
  user_connect_api_id?: string
  pipedream?: object | null | any
  is_pipedream?: boolean
  sloot?: object | null | any
}

interface ToolModalProps {
  isAdmin?: boolean
  mode: 'create' | 'edit'
  tool?: Tool | null
  onToolCreated?: (tool: any) => void
  onToolUpdated?: (tool: any) => void
  onClose?: () => void
  opened: boolean
  onCloseModal: () => void
}

export default function ToolModal({ isAdmin = false, mode, tool, onToolCreated, onToolUpdated, onClose, opened, onCloseModal }: ToolModalProps) {
  const [saving, setSaving] = useState(false)
  const [isSlootEnabled, setIsSlootEnabled] = useState(tool?.is_sloot || false)
  const { createTool, updateTool } = useToolsStore()

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      tool_name: '',
      avatar: '',
      user_connect_api_id: '',
      is_sloot: false,
      sloot: {
        pricing: {
          type: 'per',
          amount: 0.1,
        },
        type: '',
        category: '',
        brand: '',
        id: '',
      },
      schema: null,
    },
  })

  // Update form values when tool changes or modal opens
  useEffect(() => {
    if (opened) {
      if (tool && mode === 'edit') {
        const isSloot = tool.is_sloot || false
        setIsSlootEnabled(isSloot)
        form.setValues({
          tool_name: tool.tool_name || '',
          avatar: tool.avatar || '',
          user_connect_api_id: tool.user_connect_api_id || '',
          is_sloot: isSloot,
          sloot: tool.sloot || {
            pricing: {
              type: 'per',
              amount: 0.1,
            },
            type: '',
            category: '',
            brand: '',
            id: '',
          },
          schema: tool.schema || null,
        })
      } else if (mode === 'create') {
        // Reset form for create mode
        form.setValues({
          tool_name: '',
          avatar: '',
          user_connect_api_id: '',
          is_sloot: false,
          sloot: {
            pricing: {
              type: 'per',
              amount: 0.1,
            },
            type: '',
            category: '',
            brand: '',
            id: '',
          },
          schema: null,
        })
        setIsSlootEnabled(false)
      }
    }
  }, [opened, tool, mode])

  const handleSave = useCallback(async () => {
    const values = form.getValues()

    if (!values.tool_name.trim()) {
      showNotification({ title: 'Error', message: 'Tool name is required', type: 'error' })
      return
    }

    setSaving(true)

    try {
      let result
      if (mode === 'create') {
        result = await createTool(values as any)
        if (result) {
          showNotification({ title: 'Success', message: 'Tool created successfully', type: 'success' })
          onToolCreated?.(result)
        }
      } else {
        result = await updateTool({ ...values, id: tool?.id } as any)
        if (result) {
          showNotification({ title: 'Success', message: 'Tool updated successfully', type: 'success' })
          onToolUpdated?.(result)
        }
      }

      if (result) {
        onCloseModal()
        onClose?.()
      } else if (mode === 'edit') {
        // For edit mode, close modal even if no result returned
        onCloseModal()
        onClose?.()
      }
    } catch (error) {
      console.error('Error saving tool:', error)
      showNotification({ title: 'Error', message: 'Failed to save tool', type: 'error' })
    } finally {
      setSaving(false)
    }
  }, [form, mode, tool?.id, createTool, updateTool, onToolCreated, onToolUpdated, onCloseModal, onClose])

  return (
    <Modal opened={opened} onClose={onCloseModal} title={mode === 'create' ? 'Create New Tool' : 'Edit Tool Settings'} size="md">
      <FormProvider form={form}>
        <form>
          <Stack gap="md">
            <TextInput label="Tool Name" placeholder="Enter tool name" {...form.getInputProps('tool_name')} required />

            <TextInput label="Avatar URL" placeholder="Enter avatar image URL (optional)" {...form.getInputProps('avatar')} />

            <ApiConnectionManager
              value={form.getValues().user_connect_api_id || undefined}
              onChange={(value) => form.setFieldValue('user_connect_api_id', value || '')}
              label="API Connection"
              onConnectionCreated={(connectionId) => form.setFieldValue('user_connect_api_id', connectionId)}
            />

            {isAdmin && (
              <Switch
                label="Admin Tool"
                description="Make this tool available to all users (admin only)"
                checked={isSlootEnabled}
                onChange={(event) => {
                  const checked = event.currentTarget.checked
                  setIsSlootEnabled(checked)
                  form.setFieldValue('is_sloot', checked)
                }}
              />
            )}

            {isAdmin && isSlootEnabled && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>
                  Sloot Configuration
                </Text>
                <Text size="xs" c="dimmed" mb="xs">
                  Additional JSON configuration for sloot tools
                </Text>
                <DisplayJsonCodeMirror
                  value={typeof form.getValues().sloot === 'string' ? form.getValues().sloot : JSON.stringify(form.getValues().sloot || {}, null, 2)}
                  onChange={(value) => {
                    try {
                      const parsed = JSON.parse(value)
                      form.setFieldValue('sloot', parsed)
                    } catch {
                      form.setFieldValue('sloot', value)
                    }
                  }}
                  placeholder='{"key": "value"}'
                  height="200px"
                  showFormatButton={true}
                />
              </Stack>
            )}

            <Group justify="flex-end">
              <Button variant="light" onClick={onCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {mode === 'create' ? 'Create Tool' : 'Save Changes'}
              </Button>
            </Group>
          </Stack>
        </form>
      </FormProvider>
    </Modal>
  )
}
