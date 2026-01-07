import { Badge, Button, Group, Modal, ScrollArea, Stack, Table, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { RiHistoryLine, RiMoneyDollarCircleLine } from '@remixicon/react'
import { useEffect } from 'react'
import useAiStore from '~/lib/store/aiStore'
import usePaymentStore from '~/lib/store/paymentStore'

interface Transaction {
  id: string
  user_id: string
  transaction_type: 'payment' | 'usage' | 'refund' | 'adjustment'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  stripe_payment_intent_id?: string
  stripe_charge_id?: string
  description?: string
  usage_id?: string
  created_at: string
  updated_at: string
}

export default function TransactionsModal() {
  const [opened, { open, close }] = useDisclosure(false)
  const { user } = useAiStore()
  const { loadTransactions, getTransactions, getLoading } = usePaymentStore()

  // Load transactions when modal opens
  useEffect(() => {
    if (opened && user?.id) {
      loadTransactions(user.id)
    }
  }, [opened, user?.id, loadTransactions])

  const transactions = getTransactions()

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(4)}`
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

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <RiMoneyDollarCircleLine size={16} />
      case 'usage':
        return <RiHistoryLine size={16} />
      default:
        return <RiHistoryLine size={16} />
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'green'
      case 'usage':
        return 'blue'
      case 'refund':
        return 'orange'
      case 'adjustment':
        return 'violet'
      default:
        return 'gray'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green'
      case 'pending':
        return 'yellow'
      case 'failed':
        return 'red'
      case 'refunded':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'green'
      case 'usage':
        return 'red'
      case 'refund':
        return 'orange'
      case 'adjustment':
        return 'violet'
      default:
        return 'gray'
    }
  }

  const formatAmount = (amount: number, type: string) => {
    const formattedAmount = formatCurrency(Math.abs(amount))
    const prefix = type === 'payment' || type === 'refund' ? '+' : '-'
    return `${prefix}${formattedAmount}`
  }

  return (
    <>
      {/* Button to open modal */}
      <Button variant="outline" leftSection={<RiHistoryLine size={16} />} onClick={open}>
        View Transactions
      </Button>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap="xs">
            <RiHistoryLine size={20} />
            <Title order={3}>Transaction History</Title>
          </Group>
        }
        size="xl"
        centered
      >
        <Stack gap="md">
          {getLoading() ? (
            <Text ta="center" c="dimmed">
              Loading transactions...
            </Text>
          ) : transactions.length === 0 ? (
            <Text ta="center" c="dimmed">
              No transactions found
            </Text>
          ) : (
            <ScrollArea h={500}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {transactions.map((transaction: Transaction) => (
                    <Table.Tr key={transaction.id}>
                      <Table.Td>
                        <Group gap="xs">
                          {getTransactionTypeIcon(transaction.transaction_type)}
                          <Badge size="sm" color={getTransactionTypeColor(transaction.transaction_type)} variant="light">
                            {transaction.transaction_type}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2}>
                          {transaction.description || 'No description'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} c={getAmountColor(transaction.transaction_type)}>
                          {formatAmount(transaction.amount, transaction.transaction_type)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={getStatusColor(transaction.status)} variant="light">
                          {transaction.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatDate(transaction.created_at)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}

          <Group justify="flex-end">
            <Button variant="outline" onClick={close}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
