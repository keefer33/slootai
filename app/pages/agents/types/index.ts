export interface UserModel {
  id: string
  user_id: string
  name: string
  description: string | null
  settings: any
  model_id: string | null
  apikey?: string
  brand?: string // Added from transformation in loader
  model?: {
    model: string
    brand?: {
      slug?: string
      name?: string
    }
    description: string
    api_url?: string
  }
}
