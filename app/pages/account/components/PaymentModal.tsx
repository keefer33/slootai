import { Button, Group, Modal, NumberInput, Stack, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { RiBankCardLine, RiMoneyDollarCircleLine } from '@remixicon/react'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState } from 'react'
import { showNotification } from '~/lib/notificationUtils'
import useAiStore from '~/lib/store/aiStore'
import usePaymentStore from '~/lib/store/paymentStore'
import { stripePromise } from '~/lib/stripe'

interface PaymentModalProps {
  opened: boolean
  onClose: () => void
  message?: string
}

// Payment form component that uses Stripe Elements
function PaymentForm({ onClose }: { onClose: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const { createPaymentIntent, confirmPayment, getPaymentLoading, loadBalance } = usePaymentStore()
  const { getAuthToken, user } = useAiStore()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: {
      amount: '',
    },
    validate: {
      amount: (value) => {
        const num = Number(value)
        if (!value) return 'Amount is required'
        if (num <= 0) return 'Amount must be greater than 0'
        if (num < 1) return 'Minimum amount is $1.00'
        if (num > 1000) return 'Maximum amount is $1,000.00'
        return null
      },
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    if (!stripe || !elements) {
      showNotification({
        title: 'Error',
        message: 'Stripe not loaded',
        type: 'error',
      })
      return
    }

    setLoading(true)
    try {
      const amount = Number(values.amount)

      // Create payment intent
      const authToken = getAuthToken()
      const paymentData = await createPaymentIntent(amount, authToken)
      if (!paymentData) {
        return
      }

      // Get card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        showNotification({
          title: 'Error',
          message: 'Card element not found',
          type: 'error',
        })
        return
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(paymentData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'SlootAI User',
            email: user?.email,
          },
        },
      })

      if (error) {
        showNotification({
          title: 'Payment Failed',
          message: error.message || 'Payment could not be processed',
          type: 'error',
        })
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment on our backend
        const success = await confirmPayment(paymentData.paymentIntentId, authToken)
        if (success) {
          await loadBalance(user?.id)
          onClose()
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      showNotification({
        title: 'Error',
        message: 'Payment failed. Please try again.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <NumberInput
          label="Amount to Add"
          placeholder="Enter amount"
          leftSection={<RiMoneyDollarCircleLine size={16} />}
          min={1}
          max={1000}
          step={0.01}
          decimalScale={2}
          fixedDecimalScale
          {...form.getInputProps('amount')}
        />

        <div>
          <Text size="sm" fw={500} mb="xs">
            Card Information
          </Text>
          <div style={{ padding: '12px', border: '1px solid #e9ecef', borderRadius: '4px' }}>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <Group justify="flex-end" gap="xs">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading || getPaymentLoading()} leftSection={<RiBankCardLine size={16} />}>
            Add ${form.values.amount || '0.00'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

// Main payment modal component
export default function PaymentModal({ opened, onClose, message = '' }: PaymentModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Add Funds to Account" centered size="md">
      <Elements stripe={stripePromise}>
        <PaymentForm onClose={onClose} />
      </Elements>
      {message && (
        <Text size="sm" c="dimmed" mt="xs">
          {message}
        </Text>
      )}
    </Modal>
  )
}
