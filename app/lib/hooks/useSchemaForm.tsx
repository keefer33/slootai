import { Button, Group, Modal, NumberInput, Select, Stack, Switch, Text, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { DisplayJsonCodeMirror } from '~/shared/DisplayJsonCodeMirror'
import { renderMarkdownLinks } from '../utils'

interface SchemaProperty {
  description?: string
  type: string
  title?: string
  default?: any
  enum?: string[]
  minimum?: number
  maximum?: number
  placeholder?: string
  format?: string
}

interface Schema {
  type: string
  properties: Record<string, SchemaProperty>
  required?: string[]
  description?: string
}

interface UseSchemaFormOptions {
  schema: Schema | null | undefined
  showNoSchemaMessage?: boolean
  showNoFieldsMessage?: boolean
  onSubmit: (values: any) => Promise<any>
  submitButtonText?: string
  description?: string
}

// Utility function to remove duplicate values from Select data arrays
const removeDuplicateOptions = (data: any[]): any[] => {
  if (!Array.isArray(data)) return data

  // Handle grouped data (for Select with groups)
  if (data.length > 0 && data[0]?.group && data[0]?.items) {
    return data.map((group) => ({
      ...group,
      items: [...new Map(group.items.map((item) => [item.value, item])).values()],
    }))
  }

  // Handle simple data arrays
  return [...new Map(data.map((item) => [item.value || item, item])).values()]
}

export function useSchemaForm({ schema, showNoSchemaMessage = true, showNoFieldsMessage = true, onSubmit, submitButtonText = 'Run Tool', description }: UseSchemaFormOptions) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [opened, { open, close }] = useDisclosure(false)

  // Create initial values object with all fields having defined values
  const getInitialValues = () => {
    if (!schema?.properties) return {}
    const initialValues: Record<string, any> = {}

    Object.entries(schema.properties).forEach(([fieldName, fieldSchema]) => {
      // Set default value if available, otherwise set to appropriate empty value
      if (fieldSchema.default !== undefined) {
        initialValues[fieldName] = fieldSchema.default
      } else {
        // Set appropriate empty values based on field type
        switch (fieldSchema.type) {
          case 'string':
          case 'number':
          case 'integer':
            initialValues[fieldName] = ''
            break
          case 'boolean':
            initialValues[fieldName] = false
            break
          case 'array':
            initialValues[fieldName] = []
            break
          default:
            initialValues[fieldName] = ''
        }
      }
    })

    return initialValues
  }

  const form = useForm({
    initialValues: getInitialValues(),
  })

  // Update form values when schema changes
  useEffect(() => {
    if (!schema?.properties) return

    const newValues = getInitialValues()
    if (Object.keys(newValues).length > 0) {
      form.setValues(newValues)
    }
  }, [schema])

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const result = await onSubmit(values)
      setResults(result)
      open()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderFormField = (fieldName: string, fieldSchema: SchemaProperty) => {
    const isRequired = schema?.required?.includes(fieldName) || false

    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema.enum) {
          // Remove duplicate values to prevent Mantine errors
          const uniqueEnumValues = removeDuplicateOptions(fieldSchema.enum)
          return (
            <Select
              key={fieldName}
              label={fieldSchema.title || fieldName}
              description={fieldSchema.description}
              placeholder={fieldSchema.placeholder || `Select ${fieldName}`}
              required={isRequired}
              data={uniqueEnumValues}
              {...form.getInputProps(fieldName)}
            />
          )
        } else if (fieldSchema.format === 'textarea' || (fieldSchema.description && fieldSchema.description.length > 100)) {
          return (
            <Textarea
              key={fieldName}
              label={fieldSchema.title || fieldName}
              description={fieldSchema.description}
              placeholder={fieldSchema.placeholder}
              required={isRequired}
              minRows={3}
              {...form.getInputProps(fieldName)}
            />
          )
        } else {
          return (
            <TextInput
              key={fieldName}
              label={fieldSchema.title || fieldName}
              description={fieldSchema.description}
              placeholder={fieldSchema.placeholder}
              required={isRequired}
              {...form.getInputProps(fieldName)}
            />
          )
        }

      case 'number':
      case 'integer':
        return (
          <NumberInput
            key={fieldName}
            label={fieldSchema.title || fieldName}
            description={fieldSchema.description}
            placeholder={fieldSchema.placeholder}
            required={isRequired}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            {...form.getInputProps(fieldName)}
          />
        )

      case 'boolean':
        return <Switch key={fieldName} label={fieldSchema.title || fieldName} description={fieldSchema.description} {...form.getInputProps(fieldName, { type: 'checkbox' })} />

      case 'array':
        if (fieldSchema.enum) {
          // Remove duplicate values to prevent Mantine errors
          const uniqueEnumValues = removeDuplicateOptions(fieldSchema.enum)
          return (
            <Select
              key={fieldName}
              label={fieldSchema.title || fieldName}
              description={fieldSchema.description}
              placeholder={fieldSchema.placeholder}
              required={isRequired}
              data={uniqueEnumValues}
              multiple
              {...form.getInputProps(fieldName)}
            />
          )
        } else {
          return (
            <Textarea
              key={fieldName}
              label={fieldSchema.title || fieldName}
              description={fieldSchema.description}
              placeholder={fieldSchema.placeholder || 'Enter comma-separated values'}
              required={isRequired}
              minRows={2}
              {...form.getInputProps(fieldName)}
            />
          )
        }

      default:
        return (
          <TextInput
            key={fieldName}
            label={fieldSchema.title || fieldName}
            description={fieldSchema.description}
            placeholder={fieldSchema.placeholder}
            required={isRequired}
            {...form.getInputProps(fieldName)}
          />
        )
    }
  }

  const renderForm = () => {
    if (!schema) {
      return showNoSchemaMessage ? <Text c="dimmed">No schema available</Text> : null
    }

    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      return showNoFieldsMessage ? <Text c="dimmed">No form fields found in schema</Text> : null
    }

    return (
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {description && renderMarkdownLinks(description) && (
            <Text size="sm" pb="md">
              {renderMarkdownLinks(description)}
            </Text>
          )}
          {Object.entries(schema.properties).map(([fieldName, fieldSchema]) => renderFormField(fieldName, fieldSchema))}
        </Stack>
        <Group justify="flex-end">
          <Button type="submit" variant="filled" loading={loading}>
            {submitButtonText}
          </Button>
        </Group>
      </form>
    )
  }

  const renderResultsModal = () => (
    <Modal opened={opened} onClose={close} title="Tool Results" size="xl">
      {results && <DisplayJsonCodeMirror value={JSON.stringify(results, null, 2)} onChange={() => {}} readOnly={true} height="400px" />}
    </Modal>
  )

  return {
    form,
    loading,
    results,
    opened,
    renderForm,
    renderResultsModal,
  }
}
