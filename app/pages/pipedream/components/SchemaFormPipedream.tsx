import { Box, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import useAiStore from '~/lib/store/aiStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import CopyButton from '~/shared/CopyButton'
import { DisplayJsonCodeMirror } from '~/shared/DisplayJsonCodeMirror'
import { SchemaFormGenerator } from '~/shared/SchemaFormGenerator'

interface SchemaProperty {
  description?: string
  type: string
  title?: string
  default?: any
  enum?: string[]
  minimum?: number
  maximum?: number
  placeholder?: string
  format?: string
}

interface Schema {
  type: string
  properties: Record<string, SchemaProperty>
  required?: string[]
}

interface SchemaFormPipedreamProps {
  schema: Schema | null | undefined
  showNoSchemaMessage?: boolean
  showNoFieldsMessage?: boolean
  app: any
  nameKey: string
}

export function SchemaFormPipedream({ schema, app, nameKey }: SchemaFormPipedreamProps) {
  const { getAuthToken, getUser } = useAiStore()
  const { runPipedreamAction, getToolIdFromPipedream } = usePipedreamStore()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const form = useForm({
    initialValues: {},
    validate: {},
  })

  // Check if app is connected (has an account ID)
  const isAppConnected = app?.id

  const handleSubmit = async () => {
    // Filter out empty/undefined non-required fields
    setLoading(true)
    const values = form.getValues()
    const filteredArgs: Record<string, any> = {}
    Object.entries(values).forEach(([key, value]) => {
      const isRequired = schema?.required?.includes(key) || false
      const hasValue = value !== undefined && value !== null && value !== ''

      // Include field if it's required OR if it has a value
      if (isRequired || hasValue) {
        filteredArgs[key] = value
      }
    })
    const toolId = await getToolIdFromPipedream(nameKey, getUser().id)
    const payload = { authProvisionId: app.id, toolName: nameKey, toolId: toolId, appType: app.app.authType === 'oauth' ? app.app.nameSlug : 'app', args: filteredArgs }
    const res = await runPipedreamAction(payload, getAuthToken())
    setResults(res)
    open()
    setLoading(false)
    return res
  }

  return (
    <>
      {!isAppConnected ? (
        <Text c="dimmed" ta="center" py="md">
          Please connect your account to use this tool
        </Text>
      ) : (
        <>
          {/* Form */}
          <FormProvider form={form}>
            <form>
              <Stack gap="md">
                <SchemaFormGenerator schema={schema} />
              </Stack>
              <Group justify="flex-end" py="md">
                <Button size="xs" variant="filled" onClick={() => handleSubmit()} loading={loading}>
                  Run
                </Button>
              </Group>
            </form>
          </FormProvider>

          <Modal opened={opened} onClose={close} title="Tool Results" fullScreen>
            <Box pos="relative" h="100%">
              {results && (
                <>
                  <DisplayJsonCodeMirror value={JSON.stringify(results, null, 2)} onChange={() => {}} readOnly={true} height="calc(100vh - 100px)" />
                  <Box
                    pos="absolute"
                    bottom={25}
                    right={25}
                    style={{
                      zIndex: 10,
                    }}
                  >
                    <CopyButton text={JSON.stringify(results, null, 2)} tooltipLabel="Copy results" size="lg" variant="filled" />
                  </Box>
                </>
              )}
            </Box>
          </Modal>
        </>
      )}
    </>
  )
}
