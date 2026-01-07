import { Alert, Badge, Box, Group, Loader, Text } from '@mantine/core'
import { RiCheckLine } from '@remixicon/react'
import { useEffect, useRef, useState } from 'react'
import useThreadsStore from '~/lib/store/threadsStore'

interface StatusAlertProps {
  type: 'start' | 'in_progress' | 'added' | 'done'
  status: string
  elapsedTime: number
  onClose?: () => void
}

function StatusAlert({ type, status, elapsedTime, onClose }: StatusAlertProps) {
  const formatElapsedTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isCompleted = type === 'done'
  const displayStatus = isCompleted ? status.replace('...', ' completed') : status

  return (
    <Alert
      variant="transparent"
      icon={isCompleted ? <RiCheckLine size={16} /> : <Loader size="xs" />}
      p="xs"
      withCloseButton={isCompleted}
      onClose={isCompleted ? onClose : undefined}
    >
      <Group gap="xs" align="center" justify="space-between" wrap="wrap">
        <Text size="sm" c="dimmed">
          {displayStatus}
        </Text>
        <Badge size="md" variant="transparent">
          {formatElapsedTime(elapsedTime)}
        </Badge>
      </Group>
    </Alert>
  )
}

export function LiveStreamUpdates() {
  const { liveStreamUpdates } = useThreadsStore()
  const [elapsedTime, setElapsedTime] = useState(0)
  const startTimeRef = useRef<number | null>(null)

  // Timer effect
  useEffect(() => {
    if (!liveStreamUpdates) {
      setElapsedTime(0)
      startTimeRef.current = null
      return
    }

    // If completed, calculate final time and don't reset
    if (liveStreamUpdates.type === 'done') {
      if (startTimeRef.current) {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current) / 1000)
        setElapsedTime(elapsed)
      }
      return
    }

    // Start timer immediately for 'start' type or if no start time exists
    if (liveStreamUpdates.type === 'start' || !startTimeRef.current) {
      const currentTime = Date.now()
      startTimeRef.current = currentTime
      setElapsedTime(0)

      // Start the timer immediately
      const updateTimer = () => {
        if (startTimeRef.current) {
          const now = Date.now()
          const elapsed = Math.floor((now - startTimeRef.current) / 1000)
          setElapsedTime(elapsed)
        }
      }

      // Update immediately
      updateTimer()

      // Update every second
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }

    // For other types, just update the display without resetting timer
    const updateTimer = () => {
      if (startTimeRef.current) {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current) / 1000)
        setElapsedTime(elapsed)
      }
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [liveStreamUpdates])

  if (!liveStreamUpdates) {
    return null
  }

  const { type, status } = liveStreamUpdates as { type: 'start' | 'in_progress' | 'added' | 'done'; status: any }

  const handleClose = () => {
    const { setLiveStreamUpdates } = useThreadsStore.getState()
    setLiveStreamUpdates(null)
  }

  return (
    <Box>
      <StatusAlert type={type} status={status} elapsedTime={elapsedTime} onClose={handleClose} />
    </Box>
  )
}
