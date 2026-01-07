import { Badge, Button, Divider, Popover, ScrollArea, Text } from '@mantine/core'
import { RiArrowDownSLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import useAiStore from '~/lib/store/aiStore'

export default function AgentSelect() {
  const { selectedAgent, userModels, models } = useAiStore()
  const [listModels, setListModels] = useState([])
  const [opened, setOpened] = useState(false)

  const makeList = async (data) => {
    const agentList = data
      .map((agent) => {
        // Get the model info from the models array using agent.model_id
        const modelInfo = models?.find((model) => model.id === agent.model_id)
        const modelDisplayName = modelInfo?.model || 'Unknown Model'
        const brand = modelInfo?.brand || 'Unknown'

        return {
          label: (
            <Button
              justify="space-between"
              fullWidth
              rightSection={
                <Badge size="sm" style={{ cursor: 'pointer' }}>
                  {modelDisplayName}
                </Badge>
              }
              key={agent.id}
              onClick={() => switchModel(agent.id)}
              variant="transparent"
            >
              <Text maw="180px" truncate="end">
                {agent.name}
              </Text>
            </Button>
          ),
          value: agent.id,
          brand,
          model: modelInfo?.model || 'Unknown',
        }
      })
      .sort((a, b) => {
        // First sort by brand
        if (a.brand !== b.brand) {
          return a.brand.localeCompare(b.brand)
        }
        // Then sort by model within the same brand
        return a.model.localeCompare(b.model)
      })
    setListModels(agentList)
  }

  const init = async () => {
    if (userModels && models) {
      makeList(userModels)
    }
  }

  const switchModel = async (modelId) => {
    setOpened(false)
    // Force a full page navigation to trigger the loader to run again
    window.location.href = `/account/agents/${modelId}`
  }

  useEffect(() => {
    init()
  }, [selectedAgent, models])

  const selectedOption = listModels.find((item) => item.value === selectedAgent?.id)

  // Extract the agent name from the selected option
  const getSelectedAgentName = () => {
    if (!selectedOption) return 'Switch Agent'
    // The label is a React component, we need to extract the text from the first Text component
    const textComponent = selectedOption.label?.props?.children?.[0]
    return textComponent?.props?.children || 'Switch Agent'
  }

  return (
    <Popover width="xl" withOverlay opened={opened} onChange={setOpened} position="bottom">
      <Popover.Target>
        <Button variant="light" size="xs" onClick={() => setOpened(!opened)} rightSection={<RiArrowDownSLine size={16} />} style={{ minWidth: '150px' }}>
          {getSelectedAgentName()}
        </Button>
      </Popover.Target>

      <Popover.Dropdown p="xs">
        <ScrollArea h={`300px`} offsetScrollbars>
          {listModels.reduce((acc, item, index) => {
            const prevItem = index > 0 ? listModels[index - 1] : null
            const isNewBrand = !prevItem || prevItem.brand !== item.brand

            if (isNewBrand) {
              acc.push(<Divider key={`brand-${item.brand}`} label={item.brand} labelPosition="center" />)
            }

            acc.push(item.label)

            return acc
          }, [])}
        </ScrollArea>
      </Popover.Dropdown>
    </Popover>
  )
}
