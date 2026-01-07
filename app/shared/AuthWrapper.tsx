import { useMounted } from '@mantine/hooks'
import { Notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { Outlet, useLoaderData, useNavigate } from 'react-router'
import { getToolsSloot } from '~/api/supabase/admin/getToolsSloot'
import { getModels } from '~/api/supabase/getModels'
import useAiStore from '~/lib/store/aiStore'
import useToolsStore from '~/lib/store/toolsStore'
import PageLoader from './PageLoader'

export async function loader() {
  const { slootTools, slootToolsError } = await getToolsSloot()
  const { models, modelsError } = await getModels()

  // Convert database errors to proper HTTP errors
  if (modelsError) {
    throw modelsError
  }
  if (slootToolsError) {
    throw slootToolsError
  }

  return { models: models, slootTools: slootTools }
}

export default function AuthWrapper() {
  const mounted = useMounted()
  const { models, slootTools } = useLoaderData<typeof loader>()
  const { user, setModels, appLoading, authToken, isAdmin } = useAiStore()
  const { setSlootTools, getSlootTools } = useToolsStore()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const parsedModels = (models) => {
    return models?.map((model) => {
      if (model.forms && model.forms.form_to_fields) {
        // Transform forms to be an array of sorted form fields
        const sortedFormFields = model.forms.form_to_fields
          .sort((a, b) => a.field_order - b.field_order)
          .map((ftf) => ftf.form_fields)
          .filter(Boolean)

        return {
          ...model,
          forms: sortedFormFields,
        }
      } else {
        // If no forms, set forms to empty array
        return {
          ...model,
          forms: [],
        }
      }
    })
  }
  const init = async () => {
    setModels(parsedModels(models))
    if (!isAdmin) {
      setModels(parsedModels(models).filter((model) => model.type !== 'admin'))
    }
    setSlootTools(slootTools)
    setLoading(false)
  }

  // Set models from loader data and load sloot tools (only once)
  useEffect(() => {
    setLoading(true)
    init()
  }, [])

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (mounted && !appLoading && !user?.id) {
      navigate('/login', { replace: true })
    }
  }, [mounted, appLoading, user, navigate])

  // If we get here, user is authenticated
  return (
    <>
      <Notifications />
      {models && getSlootTools() && authToken && !loading ? <Outlet /> : <PageLoader />}
    </>
  )
}
