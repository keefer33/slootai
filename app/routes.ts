import { type RouteConfig, layout, route } from '@react-router/dev/routes'

export default [
  route('/', 'pages/root/Home.tsx'),
  route('/login', 'pages/root/Login.tsx'),
  route('/invite', 'pages/root/Invite.tsx'),
  route('/api-offline', 'pages/root/ApiOffline.tsx'),
  route('*', 'pages/root/404.tsx'),

  layout('shared/AuthWrapper.tsx', [
    layout('shared/AccountLayout.tsx', [
      route('/account/tools', 'pages/tools/Tools.tsx'),
      route('/account/billing', 'pages/account/Billing.tsx'),
      route('/account/files', 'pages/files/MemberFiles.tsx'),
      route('/account/agents', 'pages/agents/Agents.tsx'),
      route('/account/apikeys', 'pages/account/ApiKeys.tsx'),
      route('/account/profile', 'pages/account/UserProfile.tsx'),
      route('/account/mcpservers', 'pages/mcpservers/McpServers.tsx'),
      route('/account/mcpservers/:serverId', 'pages/mcpservers/McpServerEdit.tsx'),
      route('/account/cloud', 'pages/cloud/Cloud.tsx'),
      route('/account/cloud/select-service', 'pages/cloud/SelectService.tsx'),
      route('/account/cloud/service/:id', 'pages/cloud/ServiceDetail.tsx'),
      route('/account/cloud/select-database', 'pages/cloud/SelectDatabase.tsx'),
      route('/account/cloud/database/:id', 'pages/cloud/DatabaseDetail.tsx'),
      route('/account/pipedream', 'pages/pipedream/PipedreamConnected.tsx'),
      route('/account/pipedream/connect', 'pages/pipedream/PipedreamConnect.tsx'),
      route('/account/pipedream/:appSlug', 'pages/pipedream/PipedreamApp.tsx'),
    ]),
    layout('pages/tools/components/ToolEditorLayout.tsx', [route('/account/tools/:toolId', 'pages/tools/ToolEditor.tsx')]),
    route('/account/agents/:agentid', 'pages/agents/Agent.tsx'),
  ]),
] satisfies RouteConfig
