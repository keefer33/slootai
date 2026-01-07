import { Avatar, Button, Collapse, Group, NavLink, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiArrowDownSLine, RiArrowRightSLine, RiToolsLine } from '@remixicon/react'
import { memo, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import useToolsStore, { type Tool } from '~/lib/store/toolsStore'

export const ToolNavbar = memo(function ToolNavbar() {
  const [userToolsOpened, { toggle: toggleUserTools }] = useDisclosure(false)
  const [slootToolsOpened, { toggle: toggleSlootTools }] = useDisclosure(false)
  const [pipedreamToolsOpened, { toggle: togglePipedreamTools }] = useDisclosure(true)
  const { tools, slootTools, selectedTool } = useToolsStore()

  // Separate tools by type - memoized for reactivity
  const userTools = useMemo(() => tools?.filter((tool) => !tool.is_pipedream) || [], [tools])
  const pipedreamTools = useMemo(() => tools?.filter((tool) => tool.is_pipedream) || [], [tools])

  // Group Sloot tools by brand - memoized for reactivity
  const groupedSlootTools = useMemo(
    () =>
      slootTools.reduce(
        (acc, tool) => {
          const brand = tool.sloot?.brand || 'Unknown Brand'
          if (!acc[brand]) {
            acc[brand] = []
          }
          acc[brand].push(tool)
          return acc
        },
        {} as Record<string, Tool[]>,
      ),
    [slootTools],
  )

  // Group Pipedream tools by app name - memoized for reactivity
  const groupedPipedreamTools = useMemo(
    () =>
      pipedreamTools.reduce(
        (acc, tool) => {
          const appName = tool.pipedream?.app?.name || 'Unknown App'
          if (!acc[appName]) {
            acc[appName] = []
          }
          acc[appName].push(tool)
          return acc
        },
        {} as Record<string, Tool[]>,
      ),
    [pipedreamTools],
  )

  // State for each group
  const [slootBrandGroupStates, setSlootBrandGroupStates] = useState<Record<string, boolean>>({})
  const [appGroupStates, setAppGroupStates] = useState<Record<string, boolean>>({})

  // Auto-open groups containing the selected tool on initial load
  useEffect(() => {
    if (!selectedTool) return

    // Check if tool is in user tools
    if (userTools?.some((tool) => tool.id === selectedTool.id)) {
      if (!userToolsOpened) {
        toggleUserTools()
      }
    }
    // Check if tool is in sloot tools
    else if (slootTools?.some((tool) => tool.id === selectedTool.id)) {
      if (!slootToolsOpened) {
        toggleSlootTools()
      }
      // Also open the specific brand group
      const brand = selectedTool.sloot?.brand || 'Unknown Brand'
      if (groupedSlootTools[brand] && !slootBrandGroupStates[brand]) {
        setSlootBrandGroupStates((prev) => ({
          ...prev,
          [brand]: true,
        }))
      }
    }
    // Check if tool is in pipedream tools
    else if (pipedreamTools?.some((tool) => tool.id === selectedTool.id)) {
      if (!pipedreamToolsOpened) {
        togglePipedreamTools()
      }
      // Also open the specific app group
      const appName = selectedTool.pipedream?.app?.name || 'Unknown App'
      if (groupedPipedreamTools[appName] && !appGroupStates[appName]) {
        setAppGroupStates((prev) => ({
          ...prev,
          [appName]: true,
        }))
      }
    }
  }, [selectedTool?.id]) // Only depend on selectedTool.id, not the entire selectedTool object

  const toggleSlootBrandGroup = (brand: string) => {
    setSlootBrandGroupStates((prev) => ({
      ...prev,
      [brand]: !prev[brand],
    }))
  }

  const toggleAppGroup = (appName: string) => {
    setAppGroupStates((prev) => ({
      ...prev,
      [appName]: !prev[appName],
    }))
  }

  const renderToolSection = useMemo(() => {
    const ToolSection = (tools: Tool[], title: string, opened: boolean, toggle: () => void) => {
      if (!tools || tools.length === 0) return null

      return (
        <Stack gap="xs">
          <Button
            size="sm"
            px="4px"
            variant="light"
            justify="space-between"
            onClick={toggle}
            rightSection={opened ? <RiArrowDownSLine size={20} /> : <RiArrowRightSLine size={20} />}
          >
            <Group gap="xs">
              {title} ({tools.length})
            </Group>
          </Button>

          <Collapse in={opened}>
            <Stack gap="xs" pb="lg">
              {tools.map((tool) => (
                <NavLink
                  component={Link}
                  // leftSection={tool.avatar ? <Avatar src={tool.avatar} size="22px" radius="xl" /> : <RiToolsLine size={18} />}
                  label={tool.tool_name}
                  variant="light"
                  active={tool.id === selectedTool?.id}
                  key={tool.id}
                  to={`/account/tools/${tool.id}`}
                />
              ))}
            </Stack>
          </Collapse>
        </Stack>
      )
    }
    ToolSection.displayName = 'ToolSection'
    return ToolSection
  }, [selectedTool])

  const renderSlootBrandGroup = useMemo(() => {
    const SlootBrandGroup = (brand: string, tools: Tool[]) => {
      const isOpened = slootBrandGroupStates[brand] ?? false
      const brandIcon = tools[0]?.avatar ? <Avatar src={tools[0].avatar} size="14px" radius="xs" /> : <RiToolsLine size={14} />

      return (
        <Stack gap="xs" key={brand}>
          <Button
            size="sm"
            px="4px"
            variant="light"
            justify="space-between"
            onClick={() => toggleSlootBrandGroup(brand)}
            rightSection={isOpened ? <RiArrowDownSLine size={18} /> : <RiArrowRightSLine size={18} />}
          >
            <Group gap="xs">
              {brandIcon}
              {brand} ({tools.length})
            </Group>
          </Button>

          <Collapse in={isOpened}>
            <Stack gap="0" pb="lg">
              {tools.map((tool) => (
                <NavLink
                  component={Link}
                  //  leftSection={tool.avatar ? <Avatar src={tool.avatar} size="14px" radius="xl" /> : <RiToolsLine size={14} />}
                  label={
                    <Text size="sm" fw={500} lineClamp={1}>
                      {tool.tool_name}
                    </Text>
                  }
                  variant="filled"
                  active={tool.id === selectedTool?.id}
                  key={tool.id}
                  to={`/account/tools/${tool.id}`}
                />
              ))}
            </Stack>
          </Collapse>
        </Stack>
      )
    }
    SlootBrandGroup.displayName = 'SlootBrandGroup'
    return SlootBrandGroup
  }, [selectedTool, slootBrandGroupStates])

  const renderPipedreamAppGroup = useMemo(() => {
    const PipedreamAppGroup = (appName: string, tools: Tool[]) => {
      const isOpened = appGroupStates[appName] ?? false
      const appIcon = tools[0]?.pipedream?.app?.imgSrc ? <Avatar src={tools[0].pipedream.app.imgSrc} size="14px" radius="xl" /> : <RiToolsLine size={14} />

      return (
        <Stack gap="xs" key={appName}>
          <Button
            size="sm"
            px="4px"
            variant="light"
            justify="space-between"
            onClick={() => toggleAppGroup(appName)}
            rightSection={isOpened ? <RiArrowDownSLine size={18} /> : <RiArrowRightSLine size={18} />}
          >
            <Group gap="xs">
              {appIcon}
              {appName} ({tools.length})
            </Group>
          </Button>

          <Collapse in={isOpened}>
            <Stack gap="0" pb="lg">
              {tools.map((tool) => (
                <NavLink
                  component={Link}
                  // leftSection={tool.avatar ? <Avatar src={tool.avatar} size="14px" radius="xl" /> : <RiToolsLine size={14} />}
                  label={
                    <Text size="sm" fw={500} lineClamp={1}>
                      {tool.tool_name}
                    </Text>
                  }
                  variant="filled"
                  active={tool.id === selectedTool?.id}
                  key={tool.id}
                  to={`/account/tools/${tool.id}`}
                />
              ))}
            </Stack>
          </Collapse>
        </Stack>
      )
    }
    PipedreamAppGroup.displayName = 'PipedreamAppGroup'
    return PipedreamAppGroup
  }, [selectedTool, appGroupStates])

  return (
    <Stack gap="sm" p="xs">
      {/* User Tools Section */}
      {renderToolSection(userTools, 'Custom Tools', userToolsOpened, toggleUserTools)}

      {/* Sloot Tools Section - Grouped by Brand */}
      {Object.keys(groupedSlootTools).length > 0 && (
        <Stack gap="xs">
          <Button
            size="md"
            px="8px"
            variant="default"
            justify="space-between"
            bd="0"
            onClick={toggleSlootTools}
            rightSection={slootToolsOpened ? <RiArrowDownSLine size={20} /> : <RiArrowRightSLine size={20} />}
          >
            <Group gap="xs">Sloot Tools ({slootTools.length})</Group>
          </Button>

          <Collapse in={slootToolsOpened}>
            <Stack gap="0">{Object.entries(groupedSlootTools).map(([brand, tools]) => renderSlootBrandGroup(brand, tools))}</Stack>
          </Collapse>
        </Stack>
      )}

      {/* Pipedream Tools Section - Grouped by App */}
      {Object.keys(groupedPipedreamTools).length > 0 && (
        <Stack gap="xs">
          <Button
            size="md"
            px="8px"
            variant="default"
            justify="space-between"
            bd="0"
            onClick={togglePipedreamTools}
            rightSection={pipedreamToolsOpened ? <RiArrowDownSLine size={20} /> : <RiArrowRightSLine size={20} />}
          >
            <Group gap="xs">Pipedream Tools ({pipedreamTools.length})</Group>
          </Button>

          <Collapse in={pipedreamToolsOpened}>
            <Stack gap="0">{Object.entries(groupedPipedreamTools).map(([appName, tools]) => renderPipedreamAppGroup(appName, tools))}</Stack>
          </Collapse>
        </Stack>
      )}
    </Stack>
  )
})
