import { Box, Button, Center, Container, Divider, Grid, Group, Paper, Stack, Text, Title, useMantineColorScheme } from '@mantine/core'
import {
  RiArrowRightLine,
  RiDatabaseLine,
  RiFlashlightLine,
  RiImageLine,
  RiPlugLine,
  RiRobot2Line,
  RiServerLine,
  RiShieldCheckLine,
  RiToolsLine,
  RiVideoLine,
} from '@remixicon/react'
import { Link } from 'react-router'
import { useTheme } from '~/lib/hooks/useTheme'
import Logo from '~/shared/Logo'
import { StickyHeader } from '~/shared/StickyHeader'

export default function Home() {
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const { themeColor } = useTheme()

  const featuresWithImages = [
    {
      icon: <RiRobot2Line size={32} />,
      title: 'AI Agents',
      description:
        'Build intelligent AI agents using OpenAI GPT-4, Anthropic Claude, Google Gemini, DeepSeek, and more. Create conversational AI that can handle complex tasks and automate workflows.',
      screenshot: 'agent-builder-screenshot',
      color: themeColor,
      image: 'https://czntrvkceljlfvgjbctk.supabase.co/storage/v1/object/public/user-files/ae28c415-5f8f-4445-bbd3-0c438b3c53a7/04539ae3-7e50-4351-aa85-795e175b40fe.png',
    },
    {
      icon: <RiPlugLine size={32} />,
      title: 'Pipedream Apps',
      description:
        'Connect to 2,500+ APIs and 10,000+ tools through Pipedream. Integrate with your favorite services like Slack, Google Workspace, Salesforce, and thousands more.',
      screenshot: 'pipedream-apps-screenshot',
      color: themeColor,
      image: 'https://czntrvkceljlfvgjbctk.supabase.co/storage/v1/object/public/user-files/ae28c415-5f8f-4445-bbd3-0c438b3c53a7/cbf81b7c-6c19-4594-bcb8-4f14ce6422a9.png',
    },
    {
      icon: <RiToolsLine size={32} />,
      title: 'Custom Tools',
      description: 'Build and deploy your own custom tools with our intuitive tool builder. Create specialized functionality tailored to your specific needs and use cases.',
      screenshot: 'custom-tools-screenshot',
      color: themeColor,
      image: 'https://czntrvkceljlfvgjbctk.supabase.co/storage/v1/object/public/user-files/ae28c415-5f8f-4445-bbd3-0c438b3c53a7/01846629-ea49-444e-922a-ed1ea7c5e8bf.png',
    },
    {
      icon: <RiServerLine size={32} />,
      title: 'MCP Servers',
      description: 'Create custom Model Context Protocol (MCP) servers to organize and manage your tools. Attach any combination of tools to create specialized server endpoints.',
      screenshot: 'mcp-servers-screenshot',
      color: themeColor,
      image: 'https://czntrvkceljlfvgjbctk.supabase.co/storage/v1/object/public/user-files/ae28c415-5f8f-4445-bbd3-0c438b3c53a7/9b487ad6-096d-44b2-877b-aad232c024b9.png',
    },
    {
      icon: <RiImageLine size={32} />,
      title: 'Sloot Image Tools',
      description: 'Built-in image processing tools including generation, editing, analysis, and manipulation. Perfect for creating visual content and processing images at scale.',
      screenshot: 'image-tools-screenshot',
      color: themeColor,
      image: 'https://czntrvkceljlfvgjbctk.supabase.co/storage/v1/object/public/user-files/ae28c415-5f8f-4445-bbd3-0c438b3c53a7/40eda51d-02ce-4374-8d3f-46c1bb1fcd9e.png',
    },
  ]

  const featuresWithoutImages = [
    {
      icon: <RiVideoLine size={32} />,
      title: 'Sloot Video Tools',
      description:
        'Comprehensive video processing capabilities including generation, editing, transcription, and analysis. Create and manipulate video content with AI-powered tools.',
      screenshot: 'video-tools-screenshot',
      color: themeColor,
    },
    {
      icon: <RiDatabaseLine size={32} />,
      title: 'File Management',
      description: 'Upload, organize, and manage files that your agents can access and process. Support for images, documents, videos, and more with intelligent categorization.',
      screenshot: 'file-management-screenshot',
      color: themeColor,
    },
    {
      icon: <RiFlashlightLine size={32} />,
      title: 'Multi-Model Support',
      description: 'Access cutting-edge AI models including OpenAI GPT-5, Anthropic Claude, Google Gemini, DeepSeek, and more. Choose the best model for each task.',
      screenshot: 'models-screenshot',
      color: themeColor,
    },
    {
      icon: <RiShieldCheckLine size={32} />,
      title: 'Secure API Keys',
      description: 'Manage your API keys securely with automatic masking, regeneration, and access controls. Keep your integrations safe with enterprise-grade security.',
      screenshot: 'api-keys-screenshot',
      color: themeColor,
    },
  ]

  const stats = [
    { value: '2,500+', label: 'Pipedream APIs' },
    { value: '10,000+', label: 'Available Tools' },
    { value: '10+', label: 'AI Models' },
    { value: 'Unlimited', label: 'Custom Tools' },
  ]

  return (
    <Box>
      {/* Sticky Header */}
      <StickyHeader />

      {/* Hero Section */}
      <Paper
        bg={isDark ? 'dark.8' : 'gray.0'}
        style={{
          background: isDark ? 'linear-gradient(135deg, #1a1b1e 0%, #2d2f34 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        }}
        py={80}
        mt={60} // Add margin top to account for fixed header
      >
        <Container size="lg">
          <Center>
            <Stack align="center" gap={40} maw={800}>
              <Stack align="center" gap={20}>
                <Group gap={12}>
                  <Logo size={80} fontSize="60px" fontSizeSmall="32px" />
                </Group>
                <Title order={2} size={36} ta="center">
                  The Complete AI Agent Platform
                </Title>
                <Text size="lg" ta="center" c={isDark ? 'gray.5' : 'gray.6'} maw={600}>
                  Build intelligent AI agents with access to 2,500+ APIs, custom tools, MCP servers, and multiple AI models. Create, deploy, and scale your AI solutions.
                </Text>
              </Stack>

              <Group gap="md">
                <Button component={Link} to="/login" size="lg" leftSection={<RiArrowRightLine size={20} />}>
                  Get Started
                </Button>
                <Button component={Link} to="/login" size="lg" variant="outline">
                  Sign In
                </Button>
              </Group>
            </Stack>
          </Center>
        </Container>
      </Paper>

      {/* Stats Section */}
      <Container size="lg" py={60}>
        <Grid gutter={40}>
          {stats.map((stat, index) => (
            <Grid.Col span={{ base: 6, md: 3 }} key={index}>
              <Stack align="center" gap={8}>
                <Title order={3} size={36} c={themeColor}>
                  {stat.value}
                </Title>
                <Text size="sm" c="dimmed" ta="center">
                  {stat.label}
                </Text>
              </Stack>
            </Grid.Col>
          ))}
        </Grid>
      </Container>

      <Divider />

      {/* Features Section */}
      <Container size="lg" py={80}>
        <Stack gap={80}>
          {/* Features with Images */}
          <Stack gap={60}>
            <Title order={2} size={32} ta="center" c={themeColor}>
              Core Features
            </Title>
            {featuresWithImages.map((feature, index) => (
              <Box key={index}>
                <Grid gutter={{ base: 10, md: 60 }} align="center">
                  <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: index % 2 === 0 ? 1 : 2 }}>
                    <Stack gap={24}>
                      <Group gap={16}>
                        <Box
                          w={80}
                          h={80}
                          style={{
                            borderRadius: 16,
                            background: `var(--mantine-color-${themeColor}-1)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Box c={`${themeColor}.6`}>{feature.icon}</Box>
                        </Box>
                        <Title order={3} size={28}>
                          {feature.title}
                        </Title>
                      </Group>
                      <Text size="lg" c="dimmed" lh={1.6}>
                        {feature.description}
                      </Text>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: index % 2 === 0 ? 2 : 1 }}>
                    <Box
                      h={{ base: 250, md: 400 }}
                      style={{
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: 12,
                        }}
                      />
                    </Box>
                  </Grid.Col>
                </Grid>
              </Box>
            ))}
          </Stack>

          {/* Features without Images */}
          <Stack gap={40}>
            <Title order={2} size={32} ta="center" c={themeColor}>
              Additional Features
            </Title>
            <Grid gutter={40}>
              {featuresWithoutImages.map((feature, index) => (
                <Grid.Col span={{ base: 12, sm: 6 }} key={index}>
                  <Stack gap={20}>
                    <Group gap={16}>
                      <Box
                        w={60}
                        h={60}
                        style={{
                          borderRadius: 12,
                          background: `var(--mantine-color-${themeColor}-1)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box c={`${themeColor}.6`}>{feature.icon}</Box>
                      </Box>
                      <Title order={3} size={24}>
                        {feature.title}
                      </Title>
                    </Group>
                    <Text size="md" c="dimmed" lh={1.6}>
                      {feature.description}
                    </Text>
                  </Stack>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Stack>
      </Container>

      <Divider />

      {/* CTA Section */}
      <Container size="lg" py={80}>
        <Paper
          radius="lg"
          p={60}
          style={{
            background: isDark ? 'linear-gradient(135deg, #1a1b1e 0%, #2d2f34 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            border: `1px solid ${isDark ? '#373a40' : '#dee2e6'}`,
          }}
        >
          <Stack align="center" gap={30}>
            <Stack align="center" gap={16}>
              <Title order={2} size={32} ta="center">
                Ready to Build Your AI Agent?
              </Title>
              <Text size="lg" ta="center" c="dimmed" maw={500}>
                Join the future of AI automation. Build agents with unlimited tools, connect to thousands of APIs, and deploy custom solutions at scale.
              </Text>
            </Stack>
            <Group gap="md">
              <Button component={Link} to="/login" size="lg" leftSection={<RiArrowRightLine size={20} />}>
                Start Building
              </Button>
              <Button component={Link} to="/login" size="lg" variant="outline">
                Explore Features
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>

      {/* Footer */}
      <Paper bg={isDark ? 'dark.9' : 'gray.1'} py={40}>
        <Container size="lg">
          <Stack align="center" gap={20}>
            <Logo />
            <Text size="sm" c="dimmed" ta="center">
              © 2025 SlootAI. All rights reserved.
            </Text>
          </Stack>
        </Container>
      </Paper>
    </Box>
  )
}
