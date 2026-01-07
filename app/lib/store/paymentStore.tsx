import { create } from 'zustand'
import { showNotification } from '../notificationUtils'
import { endpoint, fetchPost, supabase } from '../utils'
import createUniversalSelectors from './universalSelectors'

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

interface PaymentState {
  balance: number
  transactions: Transaction[]
  loading: boolean
  paymentLoading: boolean

  // Actions
  setBalance: (balance: number) => void
  setTransactions: (transactions: Transaction[]) => void
  setLoading: (loading: boolean) => void
  setPaymentLoading: (loading: boolean) => void

  // Payment actions
  createPaymentIntent: (amount: number, authToken: string) => Promise<{ clientSecret: string; paymentIntentId: string } | null>
  confirmPayment: (paymentIntentId: string, authToken: string) => Promise<boolean>
  addFunds: (amount: number, paymentMethodId: string, authToken: string) => Promise<boolean>

  // Balance management
  loadBalance: (userId?: string) => Promise<void>
  loadTransactions: (userId?: string) => Promise<void>
  deductUsage: (amount: number, usageId: string, authToken: string) => Promise<boolean>

  // Getters
  getBalance: () => number
  getTransactions: () => Transaction[]
  getLoading: () => boolean
  getPaymentLoading: () => boolean
}

export const usePaymentStoreBase = create<PaymentState>((set, get) => ({
  balance: 0,
  transactions: [],
  loading: false,
  paymentLoading: false,

  setBalance: (balance) => set({ balance }),
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (loading) => set({ loading }),
  setPaymentLoading: (paymentLoading) => set({ paymentLoading }),

  // Create a Stripe PaymentIntent
  createPaymentIntent: async (amount: number, authToken: string) => {
    try {
      const response = await fetchPost({
        endpoint: `${endpoint}/payments/create-intent`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { amount: Math.round(amount * 100) }, // Convert to cents
        showNotifications: false,
      })

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to create payment intent')
      }

      return {
        clientSecret: response.client_secret,
        paymentIntentId: response.payment_intent_id,
      }
    } catch (error) {
      console.error('Error creating payment intent:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to create payment intent',
        type: 'error',
      })
      return null
    }
  },

  // Confirm a payment
  confirmPayment: async (paymentIntentId: string, authToken: string) => {
    set({ paymentLoading: true })
    try {
      const response = await fetchPost({
        endpoint: `${endpoint}/payments/confirm`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { paymentIntentId },
        showNotifications: false,
      })

      if (!response?.success) {
        throw new Error(response?.error || 'Payment confirmation failed')
      }

      // Update balance - Note: userId should be passed from the calling component
      // await get().loadBalance(userId)
      // await get().loadTransactions(userId)

      showNotification({
        title: 'Success',
        message: 'Payment completed successfully',
        type: 'success',
      })

      return true
    } catch (error) {
      console.error('Error confirming payment:', error)
      showNotification({
        title: 'Error',
        message: 'Payment confirmation failed',
        type: 'error',
      })
      return false
    } finally {
      set({ paymentLoading: false })
    }
  },

  // Add funds to account
  addFunds: async (amount: number, paymentMethodId: string, authToken: string) => {
    set({ paymentLoading: true })
    try {
      const response = await fetchPost({
        endpoint: `${endpoint}/payments/add-funds`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          paymentMethodId,
        },
        showNotifications: false,
      })

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to add funds')
      }

      // Update balance - Note: userId should be passed from the calling component
      // await get().loadBalance(userId)
      // await get().loadTransactions(userId)

      showNotification({
        title: 'Success',
        message: `$${amount} added to your account`,
        type: 'success',
      })

      return true
    } catch (error) {
      console.error('Error adding funds:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to add funds',
        type: 'error',
      })
      return false
    } finally {
      set({ paymentLoading: false })
    }
  },

  // Load user balance
  loadBalance: async (userId?: string) => {
    if (!userId) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return
    }

    try {
      const { data, error } = await supabase.from('user_profiles').select('balance, currency').eq('user_id', userId).single()

      if (error) {
        console.error('Error loading balance:', error)
        showNotification({ title: 'Error', message: 'Failed to load balance', type: 'error' })
        return
      }

      set({ balance: data?.balance || 0 })
    } catch (error) {
      console.error('Error loading balance:', error)
      showNotification({ title: 'Error', message: 'Failed to load balance', type: 'error' })
    }
  },

  // Load user transactions
  loadTransactions: async (userId?: string) => {
    if (!userId) {
      showNotification({ title: 'Error', message: 'User not authenticated', type: 'error' })
      return
    }

    try {
      const { data, error } = await supabase.from('user_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)

      if (error) {
        console.error('Error loading transactions:', error)
        showNotification({ title: 'Error', message: 'Failed to load transactions', type: 'error' })
        return
      }

      set({ transactions: data || [] })
    } catch (error) {
      console.error('Error loading transactions:', error)
      showNotification({ title: 'Error', message: 'Failed to load transactions', type: 'error' })
    }
  },

  // Deduct usage from balance
  deductUsage: async (amount: number, usageId: string, authToken: string) => {
    try {
      const response = await fetchPost({
        endpoint: `${endpoint}/payments/deduct-usage`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          usageId,
        },
        showNotifications: false,
      })

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to deduct usage')
      }

      // Update balance - Note: userId should be passed from the calling component
      // await get().loadBalance(userId)

      return true
    } catch (error) {
      console.error('Error deducting usage:', error)
      return false
    }
  },

  // Getters
  getBalance: () => get().balance,
  getTransactions: () => get().transactions,
  getLoading: () => get().loading,
  getPaymentLoading: () => get().paymentLoading,
}))

export default createUniversalSelectors(usePaymentStoreBase)
