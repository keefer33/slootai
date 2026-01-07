import { Box, Stack, useMantineTheme, NavLink as VLink } from '@mantine/core'
import { RiApps2AiLine, RiCloudLine, RiFolder2Line, RiRobot2Line, RiServerLine, RiToolsLine } from '@remixicon/react'
import { NavLink } from 'react-router'

export function Navbar({ toggleMobile }) {
  const theme = useMantineTheme()

  return (
    <Stack gap="0">
      <>
        <VLink
          component={NavLink}
          to="/account/agents"
          leftSection={
            <Box>
              <RiRobot2Line size={20} />
            </Box>
          }
          label="Agents"
          color={theme.primaryColor}
          variant="subtle"
          onClick={toggleMobile}
        />
        <VLink
          component={NavLink}
          to="/account/tools"
          leftSection={
            <Box>
              <RiToolsLine size={20} />
            </Box>
          }
          label="Tools"
          color={theme.primaryColor}
          variant="subtle"
          onClick={toggleMobile}
        />
        <VLink
          component={NavLink}
          to="/account/pipedream"
          leftSection={
            <Box>
              <RiApps2AiLine size={20} />
            </Box>
          }
          label="Pipedream Apps"
          color={theme.primaryColor}
          variant="subtle"
          onClick={toggleMobile}
        />
        <VLink
          component={NavLink}
          to="/account/mcpservers"
          leftSection={
            <Box>
              <RiServerLine size={20} />
            </Box>
          }
          label="MCP Servers"
          color={theme.primaryColor}
          variant="subtle"
          onClick={toggleMobile}
        />
        <VLink
          component={NavLink}
          to="/account/cloud"
          leftSection={
            <Box>
              <RiCloudLine size={20} />
            </Box>
          }
          label="Cloud Services"
          color={theme.primaryColor}
          variant="subtle"
          onClick={toggleMobile}
        />
        <VLink
          component={NavLink}
          to="/account/files"
          leftSection={
            <Box>
              <RiFolder2Line size={20} />
            </Box>
          }
          label="Files"
          color={theme.primaryColor}
          variant="subtle"
          onClick={toggleMobile}
        />
      </>
    </Stack>
  )
}
