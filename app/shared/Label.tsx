import { Text, Tooltip } from '@mantine/core'

export default function Label({ label, tooltip }: any) {
  return tooltip ? (
    <Tooltip color="cyan" position="top-start" multiline w={250} withArrow label={tooltip}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
    </Tooltip>
  ) : (
    <Text size="sm" fw={500}>
      {label}
    </Text>
  )
}
