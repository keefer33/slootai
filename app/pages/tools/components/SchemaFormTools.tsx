import { Badge, Box, Button, Grid, Group, Image, Modal, ScrollArea, Select, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import { FormProvider, useForm } from '~/lib/ContextForm'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import useToolsStore from '~/lib/store/toolsStore'
import PaymentModal from '~/pages/account/components/PaymentModal'
import CopyButton from '~/shared/CopyButton'
import { DisplayJsonCodeMirror } from '~/shared/DisplayJsonCodeMirror'
import PollingFile from '~/shared/PollingFile'
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

interface ToolsSchemaFormProps {
  schema:
    | {
        name?: string
        description?: string
        inputSchema?: Schema
      }
    | null
    | undefined
  toolId?: string
}

export function SchemaFormTools({ schema, toolId }: ToolsSchemaFormProps) {
  const { user, getUserBalance, getAuthToken } = useAiStore()
  const { selectedTool, getToolRuns, getSelectedRun, runsLoading, runsModalOpened, loadToolRuns, selectRun, openRunsModal, closeRunsModal, runTool } = useToolsStore()
  const [loading, setLoading] = useState(false)
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false)

  const form = useForm({
    initialValues: {},
    validate: {},
  })

  // Check if we should show an image for this tool
  const shouldShowImage = () => {
    return selectedTool?.is_sloot && (selectedTool?.sloot?.api === 'images/generations' || selectedTool?.sloot?.api === 'image/url')
  }

  // Get the image URL from the selected run's response
  const getImageUrl = () => {
    const result = getSelectedRun()?.response?.result
    if (!result?.data?.[0]?.url && typeof result !== 'string') return null
    return result.data?.[0]?.url || result
  }

  // Get the polling file ID from the selected run's response
  const getPollingFileId = () => {
    //console.log('getSelectedRun()', getSelectedRun())
    if (!getSelectedRun()?.response?.result?.pollingFileId) return null
    return getSelectedRun().response.result.pollingFileId
  }

  const handleSubmit = async () => {
    // Validate required fields first
    const formValues = form.getValues()

    const requiredFields = schema?.inputSchema?.required || []

    // Check if all required fields are filled
    const missingFields = requiredFields.filter((field) => {
      const value = formValues[field]
      return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
    })

    if (missingFields.length > 0) {
      showNotification({
        title: 'Missing Required Fields',
        message: `Please fill in the following required fields: ${missingFields.join(', ')}`,
        type: 'error',
      })
      return
    }

    const balance = await getUserBalance()
    if (balance <= 0 && selectedTool?.is_sloot) {
      showNotification({
        title: 'Insufficient Balance',
        message: 'Please add funds to your account to use this tool',
        type: 'warning',
      })
      openPaymentModal()
      return
    }
    setLoading(true)
    //const startTime = Date.now()
    const filteredValues = Object.fromEntries(Object.entries(form.getValues()).filter(([, value]) => value !== undefined && value !== null && value !== ''))

    const payload = {
      toolId: selectedTool?.id,
      payload: filteredValues,
    }

    try {
      // Make direct API call to the tool's endpoint
      await runTool(payload, getAuthToken())
      await loadToolRuns(toolId, user?.id)

      openRunsModal()
    } catch (error) {
      //const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(errorMessage)
      // Save failed run
      //await saveToolRun(filteredValues, null, 'error', errorMessage, executionTime, toolId, user?.id)

      //openRunsModal()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <FormProvider form={form}>
        <form>
          <ScrollArea h="calc(100vh - 160px)">
            <Stack gap="md" p="md">
              <SchemaFormGenerator schema={schema} />
            </Stack>
          </ScrollArea>

          <Box p="md">
            <Group gap="sm">
              <Button variant="filled" onClick={() => handleSubmit()} loading={loading} style={{ flex: 1 }}>
                Run Tool
              </Button>
              <Button variant="outline" onClick={openRunsModal} disabled={getToolRuns().length === 0}>
                View Runs ({getToolRuns().length} {getToolRuns().length >= 50 ? '+' : ''})
              </Button>
            </Group>
          </Box>
        </form>
      </FormProvider>

      <Modal opened={runsModalOpened} onClose={closeRunsModal} title="Tool Results" fullScreen>
        <Grid h="100%" gutter="md">
          {/* Left Side - Runs List */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="sm" h="100%">
              <Group justify="space-between">
                <Text fw={600} size="lg">
                  Recent Runs
                </Text>
                <Badge variant="light">{getToolRuns().length}</Badge>
              </Group>

              {runsLoading ? (
                <Text size="sm" c="dimmed">
                  Loading runs...
                </Text>
              ) : getToolRuns().length === 0 ? (
                <Text size="sm" c="dimmed">
                  No runs yet
                </Text>
              ) : (
                <Select
                  placeholder="Select a run to view details"
                  value={getSelectedRun()?.id || null}
                  onChange={(value) => {
                    const run = getToolRuns().find((r) => r.id === value)
                    selectRun(run || null)
                  }}
                  data={getToolRuns()
                    .filter((run) => run.id !== getSelectedRun()?.id)
                    .map((run) => ({
                      value: run.id,
                      label: `${run.status.toUpperCase()} - ${new Date(run.created_at).toLocaleString()}${run.execution_time_ms ? ` (${(run.execution_time_ms / 1000).toFixed(2)}s)` : ''}`,
                    }))}
                  searchable
                  clearable
                  size="sm"
                  renderOption={({ option }) => {
                    const run = getToolRuns().find((r) => r.id === option.value)
                    if (!run) return null

                    return (
                      <Group gap="sm" p="xs">
                        <Badge color={run.status === 'success' ? 'green' : run.status === 'error' ? 'red' : 'yellow'} size="sm">
                          {run.status}
                        </Badge>
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>
                            {new Date(run.created_at).toLocaleString()}
                          </Text>
                          {run.execution_time_ms && (
                            <Text size="xs" c="dimmed">
                              {(run.execution_time_ms / 1000).toFixed(2)}s
                            </Text>
                          )}
                          {run.error_message && (
                            <Text size="xs" c="red" lineClamp={1}>
                              {run.error_message}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    )
                  }}
                />
              )}

              {/* Show currently selected run information */}
              {getSelectedRun() && (
                <Box mt="sm" p="sm">
                  <Text size="sm" fw={500} mb="xs">
                    Currently Selected Run
                  </Text>
                  <Group gap="sm">
                    <Badge color={getSelectedRun()?.status === 'success' ? 'green' : getSelectedRun()?.status === 'error' ? 'red' : 'yellow'} size="sm">
                      {getSelectedRun()?.status}
                    </Badge>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {new Date(getSelectedRun()?.created_at || '').toLocaleString()}
                      </Text>
                      {getSelectedRun()?.execution_time_ms && (
                        <Text size="xs" c="dimmed">
                          {(getSelectedRun()?.execution_time_ms / 1000).toFixed(2)}s
                        </Text>
                      )}
                      {getSelectedRun()?.error_message && (
                        <Text size="xs" c="red" lineClamp={1}>
                          {getSelectedRun()?.error_message}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Box>
              )}

              {/* Show image for Sloot image generation tools */}
              {shouldShowImage() && getImageUrl() && (
                <Box>
                  <Stack gap="sm">
                    <Text fw={500} size="sm">
                      Generated Image
                    </Text>
                    <Image
                      src={getImageUrl()}
                      alt="Generated image"
                      fit="contain"
                      style={{ maxHeight: '300px', maxWidth: '100%' }}
                      fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjY2NjIi8+Cjwvc3ZnPgo="
                    />
                  </Stack>
                </Box>
              )}

              {/* Show polling file status if available */}
              {getPollingFileId() && (
                <Box>
                  <Stack gap="sm">
                    <Text fw={500} size="sm">
                      File Processing Status
                    </Text>
                    <PollingFile key={getPollingFileId()} pollingFileId={getPollingFileId()} />
                  </Stack>
                </Box>
              )}
            </Stack>
          </Grid.Col>

          {/* Right Side - Code Display */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Box h="100%" pos="relative">
              {getSelectedRun() ? (
                <>
                  <Box p="md">
                    <Group justify="space-between">
                      <Text fw={600}>Run Details</Text>
                      <Badge color={getSelectedRun().status === 'success' ? 'green' : getSelectedRun().status === 'error' ? 'red' : 'yellow'}>{getSelectedRun().status}</Badge>
                    </Group>
                  </Box>

                  <ScrollArea h="calc(100vh - 200px)">
                    <DisplayJsonCodeMirror
                      value={JSON.stringify({ payload: getSelectedRun().payload, response: getSelectedRun().response }, null, 2)}
                      onChange={() => {}}
                      readOnly={true}
                      height="auto"
                    />
                  </ScrollArea>

                  <Box pos="absolute" bottom={25} right={25} style={{ zIndex: 10 }}>
                    <CopyButton
                      text={JSON.stringify({ payload: getSelectedRun().payload, response: getSelectedRun().response }, null, 2)}
                      tooltipLabel="Copy results"
                      size="lg"
                      variant="filled"
                    />
                  </Box>
                </>
              ) : (
                <Box p="md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Text c="dimmed">Select a run to view details</Text>
                </Box>
              )}
            </Box>
          </Grid.Col>
        </Grid>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal opened={paymentModalOpened} onClose={closePaymentModal} />
    </>
  )
}
