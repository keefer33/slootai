import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe with your publishable key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY,
  currency: 'usd',
  // Add more configuration as needed
}

// Helper function to format amount for Stripe (convert to cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100)
}

// Helper function to format amount from Stripe (convert from cents)
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100
}
