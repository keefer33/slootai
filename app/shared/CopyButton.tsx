import { ActionIcon, Tooltip } from '@mantine/core'
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react'
import { useState } from 'react'
import { copyToClipboard } from '~/lib/utils'

interface CopyButtonProps {
  text: string | string[]
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'transparent' | 'light' | 'filled' | 'outline' | 'default' | 'subtle'
  color?: string
  tooltipLabel?: string
  copiedTooltipLabel?: string
  className?: string
}

export default function CopyButton({ text, size = 'md', variant = 'default', tooltipLabel = 'Copy message', copiedTooltipLabel = 'Copied!', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Tooltip label={copied ? copiedTooltipLabel : tooltipLabel}>
      <ActionIcon size={size} variant={variant} onClick={handleCopy} className={className}>
        {copied ? <RiCheckLine size={20} /> : <RiFileCopyLine size={20} />}
      </ActionIcon>
    </Tooltip>
  )
}
