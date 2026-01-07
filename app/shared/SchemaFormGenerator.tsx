import { ActionIcon, Button, Group, NumberInput, Select, Stack, Switch, Text, TextInput, Textarea } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { useFormContext } from '~/lib/ContextForm'

interface ToolSchema {
  description?: string
  inputSchema?: {
    properties: Record<string, any>
    required?: string[]
  }
  properties?: Record<string, any>
  required?: string[]
}

interface SchemaFormGeneratorProps {
  schema: ToolSchema | string | null | undefined
  showNoSchemaMessage?: boolean
  showNoFieldsMessage?: boolean
  fieldPrefix?: string
}

interface NestedFieldRendererProps {
  properties: Record<string, any>
  required: string[]
  fieldPrefix?: string
}

interface ObjectArrayRendererProps {
  fieldName: string
  fieldSchema: any
  isRequired?: boolean
  fieldPrefix?: string
}

interface StringArrayRendererProps {
  fieldName: string
  fieldSchema: any
  isRequired?: boolean
  fieldPrefix?: string
}

// Component for rendering object arrays
function ObjectArrayRenderer({ fieldName, fieldSchema, fieldPrefix = '' }: ObjectArrayRendererProps) {
  const form = useFormContext()
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName

  // Helper function to get nested value safely
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  // Helper function to set nested value
  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
  }

  // Get current array value or initialize empty array
  const currentArray = getNestedValue(form.values, fullFieldName) || []

  const addItem = () => {
    const newItem = {}
    // Initialize nested object properties with default values
    if (fieldSchema.items && fieldSchema.items.properties) {
      Object.entries(fieldSchema.items.properties).forEach(([propName, propSchema]: [string, any]) => {
        switch (propSchema.type) {
          case 'string':
            newItem[propName] = ''
            break
          case 'number':
          case 'integer':
            newItem[propName] = propSchema.minimum || 0
            break
          case 'boolean':
            newItem[propName] = false
            break
          case 'array':
            newItem[propName] = []
            break
          case 'object':
            newItem[propName] = {}
            break
          default:
            newItem[propName] = ''
        }
      })
    }

    const newArray = [...currentArray, newItem]

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values))
    setNestedValue(updatedValues, fullFieldName, newArray)
    form.setValues(updatedValues)
  }

  const removeItem = (index: number) => {
    const newArray = currentArray.filter((_: any, i: number) => i !== index)

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values))
    setNestedValue(updatedValues, fullFieldName, newArray)
    form.setValues(updatedValues)
  }

  return (
    <Stack key={form.key(fullFieldName)} gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          {fieldSchema.title || fieldName}
        </Text>
        <Button size="xs" variant="light" onClick={addItem}>
          + Add Item
        </Button>
      </Group>

      {fieldSchema.description && (
        <Text size="xs" c="dimmed">
          {fieldSchema.description}
        </Text>
      )}

      {currentArray.map((item: any, index: number) => (
        <Stack key={index} gap="sm" p="md" style={{ border: '1px solid #e9ecef', borderRadius: '4px' }}>
          <Group justify="space-between" align="center">
            <Text size="xs" fw={500} c="dimmed">
              Item {index + 1}
            </Text>
            <ActionIcon size="sm" variant="light" color="red" onClick={() => removeItem(index)}>
              ×
            </ActionIcon>
          </Group>

          {fieldSchema.items && fieldSchema.items.properties && (
            <NestedFieldRenderer properties={fieldSchema.items.properties} required={fieldSchema.items.required || []} fieldPrefix={`${fullFieldName}.${index}`} />
          )}
        </Stack>
      ))}

      {currentArray.length === 0 && (
        <Text size="xs" c="dimmed" ta="center" py="md">
          No items added yet. Click &quot;Add Item&quot; to start.
        </Text>
      )}
    </Stack>
  )
}

// Component for rendering string arrays
function StringArrayRenderer({ fieldName, fieldSchema, isRequired = false, fieldPrefix = '' }: StringArrayRendererProps) {
  const form = useFormContext()
  const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName

  // Helper function to get nested value safely
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  // Helper function to set nested value
  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
  }

  // Get current array value or initialize empty array
  const currentArray = getNestedValue(form.values, fullFieldName) || []

  // Check for maxItems in different possible locations
  const maxItems = fieldSchema.maxItems || fieldSchema.maximum || fieldSchema.maxItems || (fieldSchema.items && fieldSchema.items.maxItems) || null

  const addItem = () => {
    // Check if we've reached the maximum number of items
    if (maxItems && currentArray.length >= maxItems) {
      return
    }

    const newArray = [...currentArray, '']

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values))
    setNestedValue(updatedValues, fullFieldName, newArray)
    form.setValues(updatedValues)
  }

  const removeItem = (index: number) => {
    const newArray = currentArray.filter((_: any, i: number) => i !== index)

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values))
    setNestedValue(updatedValues, fullFieldName, newArray)
    form.setValues(updatedValues)
  }

  const updateItem = (index: number, value: string) => {
    const newArray = [...currentArray]
    newArray[index] = value

    // Create a deep copy of form values and set the nested value
    const updatedValues = JSON.parse(JSON.stringify(form.values))
    setNestedValue(updatedValues, fullFieldName, newArray)
    form.setValues(updatedValues)
  }

  return (
    <Stack key={form.key(fullFieldName)} gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          {fieldSchema.title || fieldName}
          {isRequired && <span style={{ color: 'red' }}> *</span>}
        </Text>
        <Button size="xs" variant="light" onClick={addItem} disabled={maxItems ? currentArray.length >= maxItems : false}>
          + Add Item
          {maxItems && currentArray.length >= maxItems && ' (Max reached)'}
        </Button>
      </Group>

      {fieldSchema.description && (
        <Text size="xs" c="dimmed">
          {fieldSchema.description}
        </Text>
      )}

      {maxItems && (
        <Text size="xs" c="dimmed">
          {currentArray.length} / {maxItems} items
        </Text>
      )}

      {currentArray.map((item: string, index: number) => (
        <Group key={index} gap="sm" align="flex-end">
          <TextInput
            placeholder={fieldSchema.placeholder || `Enter ${fieldName} ${index + 1}`}
            value={item}
            onChange={(event) => updateItem(index, event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <ActionIcon size="sm" variant="light" color="red" onClick={() => removeItem(index)}>
            ×
          </ActionIcon>
        </Group>
      ))}

      {currentArray.length === 0 && (
        <Text size="xs" c="dimmed" ta="center" py="md">
          No items added yet. Click &quot;Add Item&quot; to start.
        </Text>
      )}
    </Stack>
  )
}

// Recursive component for rendering nested fields
function NestedFieldRenderer({ properties, required, fieldPrefix = '' }: NestedFieldRendererProps) {
  const form = useFormContext()

  // Helper function to normalize enum data for Mantine Select
  const normalizeEnumData = (enumData: any[]) => {
    if (!Array.isArray(enumData)) return []

    // Convert all items to the format expected by Mantine Select
    const normalizedData = enumData.map((item) => {
      // If it's already an object with value/label, return as is
      if (typeof item === 'object' && item !== null && 'value' in item) {
        return item
      }
      // If it's a primitive value, convert to { value, label } format
      return {
        value: String(item),
        label: String(item),
      }
    })

    // Remove duplicates based on value
    const uniqueData = normalizedData.filter((item, index, self) => self.findIndex((other) => other.value === item.value) === index)

    return uniqueData
  }

  // Helper function to ensure parent objects exist
  const ensureParentObjects = (fieldName: string) => {
    const keys = fieldName.split('.')
    if (keys.length <= 1) return

    const currentValues = { ...form.values }
    let current = currentValues

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    // Only update if we made changes
    if (JSON.stringify(currentValues) !== JSON.stringify(form.values)) {
      form.setValues(currentValues)
    }
  }

  // Ensure parent objects exist for all fields on mount
  useEffect(() => {
    Object.keys(properties).forEach((fieldName) => {
      const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName
      ensureParentObjects(fullFieldName)
    })
  }, [properties, fieldPrefix, form])

  const renderField = (fieldName: string, fieldSchema: any, isRequired: boolean) => {
    const fullFieldName = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName

    switch (fieldSchema.type) {
      case 'object':
        return (
          <Stack key={form.key(fullFieldName)} gap="sm" p="md" style={{ border: '1px solid #e9ecef', borderRadius: '4px' }}>
            <Text size="sm" fw={500}>
              {fieldSchema.title || fieldName}
            </Text>
            {fieldSchema.description && (
              <Text size="xs" c="dimmed">
                {fieldSchema.description}
              </Text>
            )}
            {fieldSchema.properties && <NestedFieldRenderer properties={fieldSchema.properties} required={fieldSchema.required || []} fieldPrefix={fullFieldName} />}
          </Stack>
        )

      case 'array':
        if (fieldSchema.items && fieldSchema.items.type === 'object') {
          // Array of objects - use ObjectArrayRenderer
          return <ObjectArrayRenderer fieldName={fieldName} fieldSchema={fieldSchema} fieldPrefix={fieldPrefix} />
        } else if (fieldSchema.items && fieldSchema.items.enum) {
          // Array with enum items
          const selectData = Array.isArray(fieldSchema.items.enum) ? fieldSchema.items.enum : []
          const finalData = normalizeEnumData(selectData)

          return (
            <Select
              key={form.key(fullFieldName)}
              label={fieldSchema.title || fieldName}
              description={fieldSchema.description}
              placeholder={fieldSchema.placeholder}
              required={isRequired}
              {...form.getInputProps(fullFieldName)}
              data={finalData}
              multiple
            />
          )
        } else {
          // Regular array - render as dynamic list
          return <StringArrayRenderer fieldName={fieldName} fieldSchema={fieldSchema} isRequired={isRequired} fieldPrefix={fieldPrefix} />
        }

      case 'string':
        if (fieldSchema.enum) {
          const selectData = Array.isArray(fieldSchema.enum) ? fieldSchema.enum : []
          const finalData = normalizeEnumData(selectData)

          return (
            <Select
              key={form.key(fullFieldName)}
              label={fieldSchema.title || fieldName}
              description={fieldSchema.description}
              placeholder={fieldSchema.placeholder || `Select ${fieldName}`}
              required={isRequired}
              {...form.getInputProps(fullFieldName)}
              data={finalData}
              disabled={fieldSchema.readOnly}
            />
          )
        } else {
          return (
            <Textarea
              key={form.key(fullFieldName)}
              label={fieldSchema.title || fieldName}
              description={fieldSchema.description}
              placeholder={fieldSchema.placeholder}
              required={isRequired}
              {...form.getInputProps(fullFieldName)}
              minRows={1}
              autosize
              resize="vertical"
              readOnly={fieldSchema.readOnly}
              styles={
                fieldSchema.readOnly
                  ? {
                      input: {
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        cursor: 'not-allowed',
                      },
                    }
                  : undefined
              }
            />
          )
        }

      case 'number':
      case 'integer':
        return (
          <NumberInput
            key={form.key(fullFieldName)}
            label={fieldSchema.title || fieldName}
            description={fieldSchema.description}
            placeholder={fieldSchema.placeholder}
            required={isRequired}
            {...form.getInputProps(fullFieldName)}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldSchema.step || fieldSchema.multipleOf || 1}
          />
        )

      case 'boolean':
        return <Switch key={form.key(fullFieldName)} label={fieldSchema.title || fieldName} description={fieldSchema.description} {...form.getInputProps(fullFieldName)} />

      default:
        return (
          <TextInput
            key={form.key(fullFieldName)}
            label={fieldSchema.title || fieldName}
            description={fieldSchema.description}
            placeholder={fieldSchema.placeholder}
            required={isRequired}
            {...form.getInputProps(fullFieldName)}
          />
        )
    }
  }

  return (
    <>
      {Object.entries(properties).map(([fieldName, fieldSchema]) => {
        const field = fieldSchema as any
        const isRequired = required.includes(fieldName)
        return <div key={fieldName}>{renderField(fieldName, field, isRequired)}</div>
      })}
    </>
  )
}

export function SchemaFormGenerator({ schema, showNoSchemaMessage = true, showNoFieldsMessage = true }: SchemaFormGeneratorProps) {
  const form = useFormContext()
  const defaultsSetRef = useRef(false)

  if (!schema) {
    return showNoSchemaMessage ? <Text c="dimmed">No schema available</Text> : null
  }

  // Handle string schema
  let parsedSchema = schema
  if (typeof schema === 'string') {
    try {
      parsedSchema = JSON.parse(schema)
    } catch (error) {
      console.error('Error parsing schema string:', error)
      return <Text c="red">Invalid JSON schema</Text>
    }
  }

  if (typeof parsedSchema !== 'object' || !parsedSchema) {
    return <Text c="dimmed">Invalid schema format</Text>
  }

  // Check for different schema structures
  let properties = {}
  let required = []

  // Try inputSchema first (MCP format)
  if (parsedSchema.inputSchema && parsedSchema.inputSchema.properties) {
    properties = parsedSchema.inputSchema.properties || {}
    required = parsedSchema.inputSchema.required || []
  }
  // Fallback to direct properties (standard JSON Schema format)
  else if (parsedSchema.properties) {
    properties = parsedSchema.properties || {}
    required = parsedSchema.required || []
  }

  // Set default values using useEffect to avoid render-time state updates
  useEffect(() => {
    // Only set defaults once per schema to prevent infinite loops
    if (defaultsSetRef.current) {
      return
    }

    const defaultValues: Record<string, any> = {}

    // Recursive function to set defaults for nested objects
    const setDefaultsForField = (fieldName: string, fieldSchema: any, prefix = '') => {
      const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName
      const currentValue = form.values[fullFieldName]

      if (currentValue === undefined || currentValue === null) {
        if (fieldSchema.default !== undefined) {
          setNestedValue(defaultValues, fullFieldName, fieldSchema.default)
        } else {
          // Set appropriate default based on field type
          switch (fieldSchema.type) {
            case 'string':
              setNestedValue(defaultValues, fullFieldName, fieldSchema.default || '')
              break
            case 'number':
            case 'integer':
              setNestedValue(defaultValues, fullFieldName, fieldSchema.minimum || 0)
              break
            case 'boolean':
              setNestedValue(defaultValues, fullFieldName, false)
              break
            case 'array':
              if (fieldSchema.items && fieldSchema.items.type === 'object') {
                setNestedValue(defaultValues, fullFieldName, [])
              } else {
                setNestedValue(defaultValues, fullFieldName, [])
              }
              break
            case 'object':
              if (fieldSchema.properties) {
                setNestedValue(defaultValues, fullFieldName, {})
                // Recursively set defaults for nested properties
                Object.entries(fieldSchema.properties).forEach(([nestedFieldName, nestedFieldSchema]) => {
                  setDefaultsForField(nestedFieldName, nestedFieldSchema, fullFieldName)
                })
              }
              break
            default:
              setNestedValue(defaultValues, fullFieldName, '')
          }
        }
      }
    }

    // Helper function to set nested values in an object
    const setNestedValue = (obj: any, path: string, value: any) => {
      const keys = path.split('.')
      let current = obj
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
    }

    // Set defaults for all fields
    for (const [fieldName, fieldSchema] of Object.entries(properties)) {
      setDefaultsForField(fieldName, fieldSchema)
    }

    if (Object.keys(defaultValues).length > 0) {
      form.setValues(defaultValues)
    }

    defaultsSetRef.current = true
  }, [properties, form])

  if (Object.keys(properties).length === 0) {
    return showNoFieldsMessage ? <Text c="dimmed">No form fields found in schema</Text> : null
  }

  return <NestedFieldRenderer properties={properties} required={required} />
}
