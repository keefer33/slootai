import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { ActionIcon, Badge, Button, Card, Group, Modal, Stack, Tabs, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiCodeLine, RiDeleteBinLine, RiPencilLine, RiToolsLine } from '@remixicon/react'
import CodeMirror from '@uiw/react-codemirror'
import { Link } from 'react-router'
import { formatDate } from '~/lib/utils'

export function McpServerCard({ mcpServer, onEdit, onDelete, onManageTools }) {
  const [codeModalOpened, { open: openCodeModal, close: closeCodeModal }] = useDisclosure(false)

  const generateOpenAICode = () => {
    const serverName = mcpServer.server_name
    const serverUrl = mcpServer.server_url

    // For connect servers, use the auth_token they provided
    // For public/private servers, use the apikey field
    let authHeader = ''
    if (mcpServer.type === 'connect') {
      if (mcpServer.auth_token) {
        authHeader = `Authorization: "Bearer ${mcpServer.auth_token}"`
      } else {
        authHeader = `Authorization: "Bearer YOUR_API_KEY"`
      }
    } else {
      authHeader = `Authorization: "Bearer YOUR_API_KEY"`
    }

    return `import OpenAI from "openai";
const client = new OpenAI();

const resp = await client.responses.create({
    model: "gpt-5",
    input: "What tools do you have available?",
    tools: [
        {
            type: "mcp",
            server_label: "${serverName}",
            server_url: "${serverUrl}",
            headers: {
                ${authHeader}
            }
        }
    ]
});

(resp.output_text);`
  }

  const generateAnthropicCode = () => {
    const serverName = mcpServer.server_name
    const serverUrl = mcpServer.server_url

    // For connect servers, use the auth_token they provided
    // For public/private servers, use the apikey field
    let authToken = ''
    if (mcpServer.type === 'connect') {
      if (mcpServer.auth_token) {
        authToken = mcpServer.auth_token
      } else {
        authToken = 'YOUR_API_KEY'
      }
    } else {
      const apiKeyValue = 'YOUR_API_KEY'
      authToken = apiKeyValue
    }

    return `const response = await anthropic.beta.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1000,
  messages: [
    {
      role: "user",
      content: "What tools do you have available?",
    },
  ],
  mcp_servers: [
    {
      type: "url",
      url: "${serverUrl}",
      name: "${serverName}",
      authorization_token: "${authToken}",
    },
  ],
  betas: ["mcp-client-2025-04-04"],
});`
  }

  return (
    <>
      <Card key={mcpServer.id} shadow="sm" padding="sm" radius="xs">
        <Stack gap="0">
          {/* Header with name and actions */}
          <Group justify="space-between" align="flex-start">
            <Group gap="xs" align="center" style={{ cursor: 'pointer' }} onClick={() => onEdit(mcpServer)}>
              <Text fw={600} size="lg">
                {mcpServer.server_name}
              </Text>
              <ActionIcon variant="subtle" color="yellow" size="xs" title="Edit">
                <RiPencilLine size={14} />
              </ActionIcon>
            </Group>
            <Group gap={4}>
              <ActionIcon variant="subtle" color="blue" onClick={openCodeModal} title="View Integration Code">
                <RiCodeLine size={16} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red.5" onClick={() => onDelete(mcpServer)} title="Delete">
                <RiDeleteBinLine size={16} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Server Type Badge and Created Date */}
          <Group justify="space-between" align="center">
            <Badge variant="light" color={mcpServer.type === 'public' ? 'green' : mcpServer.type === 'connect' ? 'orange' : 'blue'} size="sm">
              {mcpServer.type === 'public' ? 'Public Server' : mcpServer.type === 'connect' ? 'Connect Server' : 'Private Server'}
            </Badge>
            <Text size="xs" c="dimmed">
              Created: {formatDate(mcpServer.created_at)}
            </Text>
          </Group>

          {/* Server URL */}
          <Text size="sm" style={{ wordBreak: 'break-all' }}>
            {mcpServer.server_url}
          </Text>

          {/* Auth Token info for connect servers */}
          {mcpServer.type === 'connect' && (
            <Text size="xs" c="dimmed">
              {mcpServer.auth_token ? 'Auth token configured' : 'No auth token'}
            </Text>
          )}

          {/* Tools Count and Manage Tools Button */}
          {mcpServer.type !== 'connect' && (
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text size="sm" fw={500} c="dimmed">
                  Tools
                </Text>
                <Button size="xs" variant="light" leftSection={<RiToolsLine size={14} />} onClick={() => onManageTools(mcpServer)}>
                  Manage Tools
                </Button>
              </Group>
              <Text size="sm">Manage tools</Text>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Integration Code Modal */}
      <Modal opened={codeModalOpened} onClose={closeCodeModal} title={`Integration Code - ${mcpServer.server_name}`} size="lg">
        <Stack gap="md">
          <Text size="md" c="dimmed">
            Use this code to integrate the <strong>{mcpServer.server_name}</strong> MCP server with your AI client:
          </Text>

          <Tabs defaultValue="openai">
            <Tabs.List>
              <Tabs.Tab value="openai">OpenAI</Tabs.Tab>
              <Tabs.Tab value="anthropic">Anthropic Claude</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="openai" pt="xs">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="md" fw={500}>
                    JavaScript/TypeScript Example
                  </Text>
                  <Button size="xs" variant="light" onClick={() => navigator.clipboard.writeText(generateOpenAICode())}>
                    Copy Code
                  </Button>
                </Group>
                <CodeMirror value={generateOpenAICode()} height="auto" extensions={[javascript()]} theme={oneDark} readOnly style={{ fontSize: '14px' }} />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="anthropic" pt="xs">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="md" fw={500}>
                    JavaScript/TypeScript Example
                  </Text>
                  <Button size="xs" variant="light" onClick={() => navigator.clipboard.writeText(generateAnthropicCode())}>
                    Copy Code
                  </Button>
                </Group>
                <CodeMirror value={generateAnthropicCode()} height="auto" extensions={[javascript()]} theme={oneDark} readOnly style={{ fontSize: '14px' }} />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          {/* Only show notes for public/private servers */}
          {mcpServer.type !== 'connect' && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Notes:
              </Text>

              <Text size="sm" c="dimmed">
                • You can find your API key in your{' '}
                <Link to="/account/profile" style={{ color: 'inherit', textDecoration: 'underline' }}>
                  profile settings
                </Link>
              </Text>

              <Text size="sm" c="dimmed">
                • The <code>server_label</code> should match your server name: <strong>{mcpServer.server_name}</strong>
              </Text>
              <Text size="sm" c="dimmed">
                • The <code>server_url</code> is: <strong>{mcpServer.server_url}</strong>
              </Text>
            </Stack>
          )}
        </Stack>
      </Modal>
    </>
  )
}
