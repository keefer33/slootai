import { ActionIcon, Badge, Button, Card, Center, Grid, Group, Pagination, Paper, ScrollArea, Stack, Table, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiAddLine, RiDownloadLine, RiHistoryLine, RiMoneyDollarCircleLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import usePaymentStore from '~/lib/store/paymentStore'
import { formatCurrency, supabase } from '~/lib/utils'
import Mounted from '~/shared/Mounted'
import PaymentModal from './components/PaymentModal'
import TransactionsModal from './components/TransactionsModal'

interface UsageRecord {
  id: string
  created_at: string
  user_id: string
  usage_summary: string
  input_tokens: string
  output_tokens: string
  total_cost: string
  brand: string
  model: string
  type: 'tool' | 'model'
  payment_status: 'pending' | 'deducted' | 'failed' | 'insufficient_balance'
}

export default function Billing() {
  const { pageLoading, user } = useAiStore()
  const { loadBalance, loadTransactions, getBalance, getLoading } = usePaymentStore()
  const [usageData, setUsageData] = useState<UsageRecord[]>([])
  const [addFundsOpened, { open: openAddFunds, close: closeAddFunds }] = useDisclosure(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const recordsPerPage = 50

  useEffect(() => {
    const loadBillingData = async () => {
      if (!user?.id) return

      try {
        // Load balance and transactions from payment store
        await Promise.all([loadBalance(user?.id), loadTransactions(user?.id)])

        // First, get total count for pagination
        const { count: totalCount, error: countError } = await supabase.from('user_usage').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

        if (countError) {
          console.error('Error fetching usage count:', countError)
          showNotification({
            title: 'Error',
            message: 'Failed to load usage count',
            type: 'error',
          })
          return
        }

        setTotalRecords(totalCount || 0)
        setTotalPages(Math.ceil((totalCount || 0) / recordsPerPage))

        // Fetch paginated usage data from user_usage table
        const from = (currentPage - 1) * recordsPerPage
        const to = from + recordsPerPage - 1

        const { data: usageRecords, error: usageError } = await supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (usageError) {
          console.error('Error fetching usage data:', usageError)
          showNotification({
            title: 'Error',
            message: 'Failed to load usage data',
            type: 'error',
          })
          return
        }

        setUsageData(usageRecords || [])
      } catch (error) {
        console.error('Error loading billing data:', error)
        showNotification({
          title: 'Error',
          message: 'Failed to load billing data',
          type: 'error',
        })
      }
    }

    loadBillingData()
  }, [user?.id, currentPage, loadBalance, loadTransactions])

  // Remove old handleAddFunds function - now handled by PaymentModal

  const handleDownloadInvoice = () => {
    // TODO: Implement invoice download
    showNotification({
      title: 'Coming Soon',
      message: 'Invoice download feature will be available soon',
      type: 'info',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getUsageTypeColor = (type: string) => {
    switch (type) {
      case 'tool':
        return 'green'
      case 'model':
        return 'blue'
      default:
        return 'gray'
    }
  }

  const getBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'anthropic':
        return 'orange'
      case 'openai':
        return 'green'
      case 'google':
        return 'blue'
      case 'unknown':
        return 'gray'
      default:
        return 'violet'
    }
  }

  const totalUsage = usageData.reduce((sum, record) => sum + Number(record.total_cost), 0)
  const thisMonthUsage = usageData
    .filter((record) => {
      const recordDate = new Date(record.created_at)
      const now = new Date()
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, record) => sum + Number(record.total_cost), 0)

  if (getLoading()) {
    return (
      <Center h="50vh">
        <Text>Loading billing information...</Text>
      </Center>
    )
  }

  return (
    <Mounted pageLoading={pageLoading}>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Title order={2}>Billing & Usage</Title>
          <Group gap="xs">
            <TransactionsModal />
            <Button leftSection={<RiDownloadLine size={16} />} onClick={handleDownloadInvoice}>
              Download Invoice
            </Button>
          </Group>
        </Group>

        {/* Balance and Quick Actions */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Current Balance
                  </Text>
                  <ActionIcon variant="subtle">
                    <RiMoneyDollarCircleLine size={20} />
                  </ActionIcon>
                </Group>
                <Text size="2rem" fw={700} c={getBalance() < 0 ? 'red.5' : 'green'}>
                  {formatCurrency(getBalance())}
                </Text>
                <Button leftSection={<RiAddLine size={16} />} onClick={openAddFunds} fullWidth>
                  Add Funds
                </Button>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    This Month
                  </Text>
                  <ActionIcon variant="subtle" color="orange">
                    <RiHistoryLine size={20} />
                  </ActionIcon>
                </Group>
                <Text size="2rem" fw={700} c="orange">
                  {formatCurrency(thisMonthUsage)}
                </Text>
                <Text size="sm" c="dimmed">
                  Total usage this month
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Usage Statistics */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3}>Usage Statistics</Title>
              <Badge variant="light" color="blue">
                {usageData.length} transactions
              </Badge>
            </Group>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="xl" fw={700} c="green">
                      {formatCurrency(totalUsage)}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Total Spent
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="xl" fw={700} c="blue">
                      {usageData.filter((r) => r.type === 'model').length}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Model Calls
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper p="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="xl" fw={700} c="violet">
                      {usageData.filter((r) => r.type === 'tool').length}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Tool Executions
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>

        {/* Usage History */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3}>Usage History</Title>
              <Group gap="xs">
                <Button variant="outline" size="xs">
                  Filter
                </Button>
                <Button variant="outline" size="xs">
                  Export
                </Button>
              </Group>
            </Group>

            <ScrollArea h={400}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Model/Tool</Table.Th>
                    <Table.Th>Brand</Table.Th>
                    <Table.Th>Tokens</Table.Th>
                    <Table.Th>Cost</Table.Th>
                    <Table.Th>Payment Status</Table.Th>
                    <Table.Th>Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {usageData.map((record) => (
                    <Table.Tr key={record.id}>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge size="sm" variant="light" color={getUsageTypeColor(record.type)}>
                            {record.type}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {record.model}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={getBrandColor(record.brand)} variant="light">
                          {record.brand}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {record.input_tokens !== '0' && record.output_tokens !== '0'
                            ? `${record.input_tokens} in / ${record.output_tokens} out`
                            : record.input_tokens !== '0'
                              ? `${record.input_tokens} in`
                              : record.output_tokens !== '0'
                                ? `${record.output_tokens} out`
                                : '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} c="green">
                          {formatCurrency(record.total_cost)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={
                            record.payment_status === 'deducted'
                              ? 'green'
                              : record.payment_status === 'failed'
                                ? 'red'
                                : record.payment_status === 'insufficient_balance'
                                  ? 'orange'
                                  : 'gray'
                          }
                          variant="light"
                        >
                          {record.payment_status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatDate(record.created_at)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                  Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
                </Text>
                <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} size="sm" withEdges />
              </Group>
            )}
          </Stack>
        </Card>

        {/* Add Funds Modal */}
        <PaymentModal opened={addFundsOpened} onClose={closeAddFunds} />
      </Stack>
    </Mounted>
  )
}
