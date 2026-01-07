import { Box, Input, Stack, TextInput } from '@mantine/core'
import { useInViewport } from '@mantine/hooks'
import { RiSearch2Line } from '@remixicon/react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from '~/lib/ContextForm'
import useAiStore from '~/lib/store/aiStore'
import usePipedreamStore from '~/lib/store/pipedreamStore'
import PageLoader from '~/shared/PageLoader'
import PipedreamAppListApps from './PipedreamAppListApps'

export default function PipedreamAppList() {
  const { hasMoreData, setHasMoreData, setApps, getApps, getPageInfo, setPageInfo, getPipedreamApps, reset } = usePipedreamStore()
  const [loading, setLoading] = useState(false)
  const { getAuthToken } = useAiStore()
  // Use Mantine's use-in-viewport hook
  const { ref, inViewport } = useInViewport()

  const form = useForm({
    initialValues: {
      search: '',
    },
    onValuesChange: async (values) => {
      setLoading(true)
      setApps([])
      if (values.search.length > 0) {
        const apps: any = await getPipedreamApps(`?q=${values.search}`, getAuthToken())
        setApps(apps.data)
        setPageInfo(apps.pageInfo)
        // Set hasMoreData for search results
        if (apps?.pageInfo) {
          const hasMore = apps.pageInfo.count < apps.pageInfo.totalCount
          setHasMoreData(hasMore)
        }

        getApps()
      } else {
        reset()
        loadInitialApps()
      }
      setLoading(false)
    },
  })

  const loadInitialApps = async () => {
    setLoading(true)
    await getPipedreamApps('', getAuthToken())
    setLoading(false)
  }

  const loadMoreApps = useCallback(async () => {
    const pageInfo = getPageInfo()

    if (!pageInfo?.endCursor || pageInfo.count >= pageInfo.totalCount) {
      setHasMoreData(false)
      return
    }

    const query = form.values.search.length > 0 ? `?q=${form.values.search}&after=${pageInfo.endCursor}` : `?after=${pageInfo.endCursor}`
    await getPipedreamApps(query, getAuthToken())
  }, [form.values.search, getApps, setApps, setHasMoreData])

  const handleClear = () => {
    form.setValues({ search: '' })
  }

  // Update hasMoreData when data changes
  useEffect(() => {
    const pageInfo = getPageInfo()
    if (pageInfo) {
      const hasMore = pageInfo.count < pageInfo.totalCount
      setHasMoreData(hasMore)
    }
  }, [getPageInfo()?.count, getPageInfo()?.totalCount, setHasMoreData])

  // Auto-load when the load more button comes into viewport
  useEffect(() => {
    if (inViewport && hasMoreData && !loading) {
      loadMoreApps()
    }
  }, [inViewport, hasMoreData, loading, loadMoreApps])

  useEffect(() => {
    if (getApps().length === 0) {
      loadInitialApps()
    }
  }, [])

  return (
    <Stack gap="lg" pb="xl">
      <TextInput
        label="Search"
        placeholder="Search"
        {...form.getInputProps('search')}
        leftSection={<RiSearch2Line />}
        rightSection={form.values.search !== '' ? <Input.ClearButton onClick={handleClear} /> : undefined}
      />
      <PipedreamAppListApps apps={getApps()} loading={loading} />
      {hasMoreData && (
        <Box ref={ref}>
          <PageLoader />
        </Box>
      )}
    </Stack>
  )
}
