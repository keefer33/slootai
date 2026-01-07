import { supabaseAdminClient } from './admin/supabaseAdminClient'

export const getModels = async () => {
  const { data: models, error: modelsError } = await supabaseAdminClient
    .from('models')
    .select(
      `
      *,
      brand:brands(slug),
      forms(
        id,
        name,
        form_to_fields(
          field_order,
          form_fields(
            id,
            type,
            name,
            label,
            description,
            required,
            defaultValue,
            options,
            toggle
          )
        )
      )
    `,
    )
    .order('id', { ascending: false })

  if (modelsError) {
    return { models: [], modelsError: modelsError }
  }
  const transformedModels = (models || []).map((model) => ({
    ...model,
    brand: model.brand?.slug || null,
  }))
  return { models: transformedModels, modelsError: null }
}
