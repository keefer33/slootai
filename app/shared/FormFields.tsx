import { Button, Checkbox, Group, Modal, MultiSelect, NumberInput, Radio, Select, Slider, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { useFormContext } from '~/lib/ContextForm'
import { DisplayJsonCodeMirror } from '~/shared/DisplayJsonCodeMirror'

interface FormField {
  id: number
  type: string
  name: string
  label: string
  description?: string
  required: boolean
  defaultValue?: any
  options?: any
  toggle?: boolean
}

// Separate component for textarea modal with its own state
function TextareaModal({ field, path }: { field: FormField; path: string }) {
  const [opened, { open, close }] = useDisclosure(false)
  const form = useFormContext()

  return (
    <>
      <Button size="xs" variant="outline" onClick={open}>
        Edit Text
      </Button>
      <Modal opened={opened} onClose={close} title={field.label} size="xl">
        <Textarea
          key={form.key(`${path}${field.name}`)}
          label={field.label}
          placeholder={field.description || ''}
          required={field.required}
          {...form.getInputProps(`${path}${field.name}`)}
         // resize="vertical"
          autosize
          minRows={25}
        />
      </Modal>
    </>
  )
}

// Component for required fields only
function RequiredFields({ formFields, path }: { formFields: FormField[]; path: string }) {
  const [fields, setFields] = useState<React.ReactNode[]>([])
  const form = useFormContext()
  // Helper to render a field
  function renderField(field: FormField) {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'date':
        return (
          <TextInput
            key={form.key(`${path}${field.name}`)}
            label={field.label}
            placeholder={field.description || ''}
            required={field.required}
            type={field.type === 'date' ? 'date' : 'text'}
            {...form.getInputProps(`${path}${field.name}`)}
          />
        )
      case 'number':
        return (
          <NumberInput
            key={form.key(`${path}${field.name}`)}
            label={field.label}
            placeholder={field.description || ''}
            required={field.required}
            min={field.options?.min}
            max={field.options?.max}
            step={field.options?.step}
            {...form.getInputProps(`${path}${field.name}`)}
          />
        )
      case 'textarea':
        return (
          <Stack key={`${path}${field.name}`} gap="xs">
            <Group justify="space-between" align="center">
              <Text size="sm" fw={500}>
                {field.label}
              </Text>
              <TextareaModal field={field} path={path} />
            </Group>
            {field.description && (
              <Text size="xs" c="dimmed">
                {field.description}
              </Text>
            )}
          </Stack>
        )
      case 'select':
        // Ensure options are properly formatted and filter out invalid ones
        const selectOptions = Array.isArray(field.options)
          ? field.options
              .map((opt: any) => ({
                value: String(opt?.value || ''),
                label: String(opt?.label || opt?.value || ''),
              }))
              .filter((opt) => opt.value && opt.label) // Filter out empty values
          : []

        return (
          <Select
            key={form.key(`${path}${field.name}`)}
            //label={field.label}
            //placeholder={field.description || ''}
            required={field.required}
            data={selectOptions}
            {...form.getInputProps(`${path}${field.name}`)}
          />
        )
      case 'multiselect':
        const fieldKey = `${path}${field.name}`
        // Ensure options are properly formatted
        const optionsData = Array.isArray(field.options)
          ? field.options
              .map((opt: any) => ({
                value: String(opt.value || ''),
                label: String(opt.label || opt.value || ''),
              }))
              .filter((opt) => opt.value && opt.label)
          : []

        return (
          <MultiSelect
            key={form.key(fieldKey)}
            label={field.label}
            placeholder={field.description || ''}
            required={field.required}
            data={optionsData}
            searchable
            clearable
            {...form.getInputProps(`${path}${field.name}`)}
          />
        )
      case 'checkbox':
        return (
          <Checkbox
            key={form.key(`${path}${field.name}`)}
            label={field.label}
            description={field.description}
            required={field.required}
            {...form.getInputProps(`${path}${field.name}`, { type: 'checkbox' })}
          />
        )
      case 'radio':
        return (
          <Radio.Group
            key={form.key(`${path}${field.name}`)}
            label={field.label}
            description={field.description}
            required={field.required}
            {...form.getInputProps(`${path}${field.name}`)}
          >
            {Array.isArray(field.options) ? field.options.map((opt: any) => <Radio key={opt.value} value={opt.value} label={opt.label} />) : null}
          </Radio.Group>
        )
      case 'slider':
        return (
          <Stack key={`${path}${field.name}`} gap={0}>
            <Text size="sm" fw={500} mb={2}>
              {field.label}
            </Text>
            <Slider
              key={form.key(`${path}${field.name}`)}
              min={field.options?.min ?? 0}
              max={field.options?.max ?? 100}
              step={field.options?.step ?? 1}
              {...form.getInputProps(`${path}${field.name}`)}
            />
            {field.description && (
              <Text size="xs" c="dimmed">
                {field.description}
              </Text>
            )}
          </Stack>
        )
      case 'json':
        return (
          <Stack key={form.key(`${path}${field.name}`)} gap="xs">
            <Text size="sm" fw={500}>
              {field.label}
            </Text>
            <DisplayJsonCodeMirror
              value={form.getValues()[`${path}${field.name}`] || ''}
              onChange={(value) => form.setFieldValue(`${path}${field.name}`, value)}
              placeholder={field.description || '{}'}
              height="200px"
              showFormatButton={true}
            />
          </Stack>
        )
      default:
        return null
    }
  }

  const init = () => {
    const getFields = formFields.map((field) => renderField(field))
    setFields(getFields)
  }

  useEffect(() => {
    init()
  }, [formFields])

  return <Stack gap="xl">{fields}</Stack>
}

// Component for optional fields that can be inserted/removed
function OptionalFields({ formFields, path, optionalListField }: { formFields: FormField[]; path: string; optionalListField: string }) {
  const [fields, setFields] = useState<React.ReactNode[]>([])
  const form = useFormContext()

  // Check if a field is currently active (exists in the optional list)
  const isFieldActive = (field: FormField) => {
    const optionalFields = form.getValues()[optionalListField] || []
    const isActive = optionalFields.some((item: any) => item[field.name] !== undefined)
    return isActive
  }

  // Get the current value for an optional field
  const getOptionalFieldValue = (field: FormField) => {
    const optionalFields = form.getValues()[optionalListField] || []
    const fieldItem = optionalFields.find((item: any) => item[field.name] !== undefined)
    let value = fieldItem ? fieldItem[field.name] : field.defaultValue || ''

    // Ensure checkbox fields always return a proper boolean
    if (field.type === 'checkbox') {
      value = value === true ? true : false
    }

    return value
  }

  // Update the value for an optional field
  const updateOptionalFieldValue = (field: FormField, value: any) => {
    const optionalFields = form.getValues()[optionalListField] || []
    const fieldIndex = optionalFields.findIndex((item: any) => item[field.name] !== undefined)

    if (fieldIndex !== -1) {
      // Update existing field value
      form.setFieldValue(`${optionalListField}.${fieldIndex}.${field.name}`, value)
    }
  }

  // Toggle field on/off
  const toggleField = (field: FormField) => {
    const optionalFields = form.getValues()[optionalListField] || []
    const fieldExists = optionalFields.some((item: any) => item[field.name] !== undefined)

    if (fieldExists) {
      // Remove field from optional list
      const fieldIndex = optionalFields.findIndex((item: any) => item[field.name] !== undefined)
      if (fieldIndex !== -1) {
        form.removeListItem(optionalListField, fieldIndex)
      }
    } else {
      // Add field to optional list with default value
      const fieldItem = {
        [field.name]: field.type === 'checkbox' ? (field.defaultValue === true ? true : false) : field.defaultValue || '',
      }
      form.insertListItem(optionalListField, fieldItem)
    }

    // Re-render after a brief delay
    setTimeout(() => {
      init()
    }, 50)
  }

  // Helper to render a field
  function renderField(field: FormField) {
    const isActive = isFieldActive(field)

    return (
      <Stack key={field.name} gap="xs">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>
            {field.label}
          </Text>
          <Button size="xs" variant={isActive ? 'filled' : 'outline'} onClick={() => toggleField(field)}>
            {isActive ? 'On' : 'Off'}
          </Button>
        </Group>
        {field.description && (
          <Text size="xs" c="dimmed">
            {field.description}
          </Text>
        )}
        {isActive && renderFieldContent(field)}
      </Stack>
    )
  }

  // Helper to render the actual field content
  function renderFieldContent(field: FormField) {
    const currentValue = getOptionalFieldValue(field)

    switch (field.type) {
      case 'text':
      case 'email':
      case 'date':
        return (
          <TextInput
            key={form.key(`${path}${field.name}`)}
            label={undefined}
            placeholder={field.description || ''}
            required={field.required}
            type={field.type === 'date' ? 'date' : 'text'}
            value={currentValue}
            onChange={(event) => updateOptionalFieldValue(field, event.currentTarget.value)}
          />
        )
      case 'number':
        return (
          <NumberInput
            key={form.key(`${path}${field.name}`)}
            label={undefined}
            placeholder={field.description || ''}
            required={field.required}
            min={field.options?.min}
            max={field.options?.max}
            step={field.options?.step}
            value={currentValue}
            onChange={(value) => updateOptionalFieldValue(field, value)}
          />
        )
      case 'textarea':
        return (
          <Textarea
            key={form.key(`${path}${field.name}`)}
            label={undefined}
            placeholder={field.description || ''}
            required={field.required}
            value={currentValue}
            onChange={(event) => updateOptionalFieldValue(field, event.currentTarget.value)}
            resize="vertical"
          />
        )
      case 'select':
        // Ensure options are properly formatted and filter out invalid ones
        const selectOptions = Array.isArray(field.options)
          ? field.options
              .map((opt: any) => ({
                value: String(opt?.value || ''),
                label: String(opt?.label || opt?.value || ''),
              }))
              .filter((opt) => opt.value && opt.label) // Filter out empty values
          : []

        return (
          <Select
            key={form.key(`${path}${field.name}`)}
            label={undefined}
            placeholder={field.description || ''}
            required={field.required}
            data={selectOptions}
            value={currentValue}
            onChange={(value) => updateOptionalFieldValue(field, value)}
          />
        )
      case 'multiselect':
        const fieldKey = `${path}${field.name}`
        // Ensure options are properly formatted
        const optionsData = Array.isArray(field.options)
          ? field.options
              .map((opt: any) => ({
                value: String(opt.value || ''),
                label: String(opt.label || opt.value || ''),
              }))
              .filter((opt) => opt.value && opt.label)
          : []

        return (
          <MultiSelect
            key={form.key(fieldKey)}
            label={undefined}
            placeholder={field.description || ''}
            required={field.required}
            data={optionsData}
            searchable
            clearable
            value={Array.isArray(currentValue) ? currentValue : []}
            onChange={(value) => updateOptionalFieldValue(field, value)}
          />
        )
      case 'checkbox':
        return (
          <Checkbox
            key={form.key(`${path}${field.name}`)}
            label={field.label}
            description={field.description}
            required={field.required}
            checked={Boolean(currentValue)}
            onChange={(event) => updateOptionalFieldValue(field, event.currentTarget.checked)}
          />
        )
      case 'radio':
        return (
          <Radio.Group
            key={form.key(`${path}${field.name}`)}
            label={undefined}
            description={undefined}
            required={field.required}
            value={currentValue}
            onChange={(value) => updateOptionalFieldValue(field, value)}
          >
            {Array.isArray(field.options) ? field.options.map((opt: any) => <Radio key={opt.value} value={opt.value} label={opt.label} />) : null}
          </Radio.Group>
        )
      case 'slider':
        return (
          <Stack key={`${path}${field.name}`} gap={0}>
            <Slider
              key={form.key(`${path}${field.name}`)}
              min={field.options?.min ?? 0}
              max={field.options?.max ?? 100}
              step={field.options?.step ?? 1}
              value={currentValue}
              onChange={(value) => updateOptionalFieldValue(field, value)}
            />
          </Stack>
        )
      case 'json':
        return (
          <DisplayJsonCodeMirror
            value={currentValue || ''}
            onChange={(value) => updateOptionalFieldValue(field, value)}
            placeholder={field.description || '{}'}
            height="200px"
            showFormatButton={true}
          />
        )
      default:
        return null
    }
  }

  const init = () => {
    // Reorder fields so active fields appear above inactive fields
    const optionalFields = form.getValues()[optionalListField] || []

    // Separate active and inactive fields
    const activeFields = []
    const inactiveFields = []

    formFields.forEach((field) => {
      const isActive = optionalFields.some((item: any) => item[field.name] !== undefined)
      if (isActive) {
        activeFields.push(field)
      } else {
        inactiveFields.push(field)
      }
    })

    // Combine active fields first, then inactive fields
    const reorderedFields = [...activeFields, ...inactiveFields]

    const getFields = reorderedFields.map((field) => renderField(field))
    setFields(getFields)
  }

  useEffect(() => {
    init()
  }, [formFields])

  return <Stack gap="xl">{fields}</Stack>
}

// Main component that renders both required and optional fields
export default function FormFields({ formFields, path, optionalListField }: { formFields: FormField[]; path: string; optionalListField: string }) {
  // Separate required and optional fields
  const requiredFields = formFields.filter((field) => !field.toggle)
  const optionalFields = formFields.filter((field) => field.toggle === true)

  return (
    <Stack gap="xl">
      {/* Render required fields first */}
      {requiredFields.length > 0 && <RequiredFields formFields={requiredFields} path={path} />}

      {/* Render optional fields below */}
      {optionalFields.length > 0 && <OptionalFields formFields={optionalFields} path={path} optionalListField={optionalListField} />}
    </Stack>
  )
}
