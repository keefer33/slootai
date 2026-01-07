import { Alert, Badge, Group, Image, Loader, Stack, Text } from '@mantine/core'
import { RiCheckLine, RiErrorWarningLine, RiFileLine, RiTimeLine } from '@remixicon/react'
import { useEffect } from 'react'
import useAiStore from '~/lib/store/aiStore'
import useToolsStore from '~/lib/store/toolsStore'
import { formatCurrency, getFileExtensionFromUrl, getFileType } from '~/lib/utils'

interface PollingFileProps {
  pollingFileId?: string
}

export default function PollingFile({ pollingFileId }: PollingFileProps) {
  const { getPollingFile, pollingFileLoading, pollingFileError, fetchPollingFile, clearPollingFile } = useToolsStore()
  const { getAuthToken } = useAiStore()

  const pollingFile = pollingFileId ? getPollingFile(pollingFileId) : null

  // Fetch on component mount and when pollingFileId changes
  useEffect(() => {
    if (pollingFileId) {
      // Clear any existing state for this polling file ID
      clearPollingFile(pollingFileId)
      fetchPollingFile(pollingFileId, getAuthToken())
    }
    console.log('pollingFileId', pollingFileId)
  }, [pollingFileId])

  // Auto-refresh every 5 seconds if status is pending
  useEffect(() => {
    if (pollingFile?.status === 'pending' || pollingFile?.status === 'processing') {
      const interval = setInterval(() => {
        if (pollingFileId) {
          fetchPollingFile(pollingFileId, getAuthToken())
        }
      }, 6000)
      return () => clearInterval(interval)
    }
  }, [pollingFile?.status, pollingFileId])

  // Show loading state
  if (pollingFileLoading && !pollingFile) {
    return (
      <Group gap="sm">
        <Loader size="sm" />
        <Text size="sm" c="dimmed">
          Loading...
        </Text>
      </Group>
    )
  }

  // Show error state
  if (pollingFileError) {
    return (
      <Alert color="red" title="Error" icon={<RiErrorWarningLine size={16} />}>
        {pollingFileError}
      </Alert>
    )
  }

  // Show pending state with enhanced UI
  if (pollingFile?.status === 'pending' || pollingFile?.status === 'processing') {
    return (
      <Stack gap="sm">
        <Group gap="sm" justify="space-between" align="center">
          <Group gap="sm">
            <Badge leftSection={<RiTimeLine size={14} />} color="yellow" size="lg" variant="light">
              Processing
            </Badge>
            <Text size="sm" fw={500} c="dimmed">
              {pollingFile.duration}s
            </Text>
          </Group>
          <Group gap="xs">
            <Loader size="xs" />
            <Text size="xs" c="dimmed">
              Auto-checking...
            </Text>
          </Group>
        </Group>
      </Stack>
    )
  }

  // Show completed state with enhanced UI
  if (pollingFile?.status === 'completed') {
    return (
      <Stack gap="sm">
        <Group gap="sm" justify="space-between" align="center">
          <Group gap="sm">
            <Badge leftSection={<RiCheckLine size={14} />} color="green" size="lg" variant="light">
              Completed
            </Badge>
            <Text size="sm" fw={500} c="dimmed">
              {pollingFile.duration}s
            </Text>
          </Group>
          <Text size="sm" fw={600} c="green">
            {formatCurrency(pollingFile.cost || 0)}
          </Text>
        </Group>

        {pollingFile.files && Array.isArray(pollingFile.files) && pollingFile.files.length > 0 && (
          <Stack gap="md">
            <Text size="sm" fw={500}>
              {pollingFile.files.length === 1 ? 'File Ready' : `${pollingFile.files.length} Files Ready`}
            </Text>

            {pollingFile.files.map((file: string, index: number) => {
              const fileExtension = getFileExtensionFromUrl(file)
              const fileType = getFileType(file)

              return (
                <div key={index}>
                  {fileType === 'video' && (
                    <div>
                      <Text size="xs" fw={500} mb="xs" c="dimmed">
                        Video {pollingFile.files.length > 1 ? `${index + 1}` : ''}
                      </Text>
                      <video controls style={{ width: '100%', maxWidth: '400px', borderRadius: '8px' }}>
                        <source src={file} type={`video/${fileExtension === 'mp4' ? 'mp4' : fileExtension}`} />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  {fileType === 'image' && (
                    <div>
                      <Text size="xs" fw={500} mb="xs" c="dimmed">
                        Image {pollingFile.files.length > 1 ? `${index + 1}` : ''}
                      </Text>
                      <Image src={file} alt={`Generated Image ${index + 1}`} width={400} height={400} />
                    </div>
                  )}
                  {fileType === 'audio' && (
                    <div>
                      <Text size="xs" fw={500} mb="xs" c="dimmed">
                        Audio {pollingFile.files.length > 1 ? `${index + 1}` : ''}
                      </Text>
                      <audio controls style={{ width: '100%', maxWidth: '400px', borderRadius: '8px' }}>
                        <source src={file} type={`audio/${fileExtension === 'mp3' ? 'mpeg' : fileExtension}`} />
                      </audio>
                    </div>
                  )}
                  {fileType === 'document' && (
                    <div>
                      <Text size="xs" fw={500} mb="xs" c="dimmed">
                        Document {pollingFile.files.length > 1 ? `${index + 1}` : ''}
                      </Text>
                      <a href={file} target="_blank" rel="noopener noreferrer">
                        Download Document {pollingFile.files.length > 1 ? `${index + 1}` : ''} (.{fileExtension})
                      </a>
                    </div>
                  )}
                  {fileType === 'unknown' && (
                    <div>
                      <Text size="xs" fw={500} mb="xs" c="dimmed">
                        File {pollingFile.files.length > 1 ? `${index + 1}` : ''}
                      </Text>
                      <a href={file} target="_blank" rel="noopener noreferrer">
                        Download File {pollingFile.files.length > 1 ? `${index + 1}` : ''} (.{fileExtension || 'unknown'})
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </Stack>
        )}
      </Stack>
    )
  }

  // Show error state with enhanced UI
  if (pollingFile?.status === 'error') {
    return (
      <Stack gap="sm">
        <Group gap="sm" justify="space-between" align="center">
          <Group gap="sm">
            <Badge leftSection={<RiErrorWarningLine size={14} />} color="red" size="lg" variant="light">
              Error
            </Badge>
            <Text size="sm" fw={500} c="dimmed">
              {pollingFile.duration}s
            </Text>
          </Group>
          <Text size="sm" fw={600} c="red">
            {formatCurrency(pollingFile.cost || 0)}
          </Text>
        </Group>

        <Alert color="red" title="Processing Error" icon={<RiErrorWarningLine size={16} />}>
          There was an error processing your file. Please try again.
        </Alert>
      </Stack>
    )
  }

  // Show unknown state
  if (pollingFile && !pollingFile.status) {
    return (
      <Alert color="gray" title="Unknown Status" icon={<RiFileLine size={16} />}>
        File status is unknown. Please try refreshing.
      </Alert>
    )
  }

  // Show nothing if no polling file data
  return null
}
