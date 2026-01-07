import { Alert, Button, Divider, Group, Modal, PasswordInput, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useEffect } from 'react'
import useAiStore from '~/lib/store/aiStore'
import { useDatabaseStore, type CreateDatabaseRequest } from '~/lib/store/databaseStore'

interface CreateDatabaseModalProps {
  opened: boolean
  onClose: () => void
  onSuccess?: (databaseId: string) => void
}

export default function CreateDatabaseModal({ opened, onClose, onSuccess }: CreateDatabaseModalProps) {
  const { user, getAuthToken } = useAiStore()
  const { selectedTemplate, createDatabase } = useDatabaseStore()

  const form = useForm<CreateDatabaseRequest>({
    initialValues: {
      type: '',
      name: '',
      description: '',
      // PostgreSQL fields
      postgres_user: '',
      postgres_password: '',
      postgres_db: '',
      postgres_initdb_args: '',
      postgres_host_auth_method: '',
      postgres_conf: '',
      // MongoDB fields
      mongo_conf: '',
      mongo_initdb_root_username: '',
      // ClickHouse fields
      clickhouse_admin_user: '',
      clickhouse_admin_password: '',
      // DragonFly fields
      dragonfly_password: '',
      // Redis fields
      redis_password: '',
      redis_conf: '',
      // KeyDB fields
      keydb_password: '',
      keydb_conf: '',
      // MariaDB fields
      mariadb_conf: '',
      mariadb_root_password: '',
      mariadb_user: '',
      mariadb_password: '',
      mariadb_database: '',
      // MySQL fields
      mysql_root_password: '',
      mysql_password: '',
      mysql_user: '',
      mysql_database: '',
      mysql_conf: '',
    },
    validate: {
      name: (value) => (value.length < 1 ? 'Name is required' : null),
      type: (value) => (value.length < 1 ? 'Type is required' : null),
    },
  })

  useEffect(() => {
    if (selectedTemplate) {
      form.setValues({
        type: selectedTemplate.id,
        name: '',
        description: '',
        // Reset all database-specific fields
        postgres_user: '',
        postgres_password: '',
        postgres_db: '',
        postgres_initdb_args: '',
        postgres_host_auth_method: '',
        postgres_conf: '',
        mongo_conf: '',
        mongo_initdb_root_username: '',
        clickhouse_admin_user: '',
        clickhouse_admin_password: '',
        dragonfly_password: '',
        redis_password: '',
        redis_conf: '',
        keydb_password: '',
        keydb_conf: '',
        mariadb_conf: '',
        mariadb_root_password: '',
        mariadb_user: '',
        mariadb_password: '',
        mariadb_database: '',
        mysql_root_password: '',
        mysql_password: '',
        mysql_user: '',
        mysql_database: '',
        mysql_conf: '',
      })
    }
  }, [selectedTemplate])

  const handleSubmit = async (values: CreateDatabaseRequest) => {
    if (!user?.id) return

    console.log('Creating database with values:', values)
    const createdDatabase = await createDatabase(values, getAuthToken())
    console.log('Created database result:', createdDatabase)

    if (createdDatabase) {
      form.reset()
      onClose()
      // Navigate to the database detail page
      if (onSuccess && createdDatabase.id) {
        console.log('Navigating to database detail page:', createdDatabase.id)
        onSuccess(createdDatabase.id)
      } else {
        console.log('No onSuccess callback or no database ID')
      }
    } else {
      console.log('Database creation failed or returned null')
    }
  }

  const renderDatabaseSpecificFields = () => {
    if (!selectedTemplate) return null

    const dbType = selectedTemplate.id.toLowerCase()

    switch (dbType) {
      case 'postgresql':
        return (
          <Stack gap="md">
            <Divider label="PostgreSQL Configuration" />
            <TextInput label="PostgreSQL User" placeholder="postgres" required {...form.getInputProps('postgres_user')} />
            <PasswordInput label="PostgreSQL Password" placeholder="Enter password" required {...form.getInputProps('postgres_password')} />
            <TextInput label="PostgreSQL Database" placeholder="postgres" required {...form.getInputProps('postgres_db')} />
            <TextInput label="Init DB Args (Optional)" placeholder="--auth-host=scram-sha-256" {...form.getInputProps('postgres_initdb_args')} />
            <TextInput label="Host Auth Method (Optional)" placeholder="scram-sha-256" {...form.getInputProps('postgres_host_auth_method')} />
            <Textarea label="PostgreSQL Config (Optional)" placeholder="PostgreSQL configuration" rows={3} {...form.getInputProps('postgres_conf')} />
          </Stack>
        )

      case 'mongodb':
        return (
          <Stack gap="md">
            <Divider label="MongoDB Configuration" />
            <TextInput label="Root Username (Optional)" placeholder="root" {...form.getInputProps('mongo_initdb_root_username')} />
            <Textarea label="MongoDB Config (Optional)" placeholder="MongoDB configuration" rows={3} {...form.getInputProps('mongo_conf')} />
          </Stack>
        )

      case 'clickhouse':
        return (
          <Stack gap="md">
            <Divider label="ClickHouse Configuration" />
            <TextInput label="Admin User" placeholder="admin" required {...form.getInputProps('clickhouse_admin_user')} />
            <PasswordInput label="Admin Password" placeholder="Enter password" required {...form.getInputProps('clickhouse_admin_password')} />
          </Stack>
        )

      case 'dragonfly':
        return (
          <Stack gap="md">
            <Divider label="DragonFly Configuration" />
            <PasswordInput label="DragonFly Password" placeholder="Enter password" required {...form.getInputProps('dragonfly_password')} />
          </Stack>
        )

      case 'redis':
        return (
          <Stack gap="md">
            <Divider label="Redis Configuration" />
            <PasswordInput label="Redis Password" placeholder="Enter password" required {...form.getInputProps('redis_password')} />
            <Textarea label="Redis Config (Optional)" placeholder="Redis configuration" rows={3} {...form.getInputProps('redis_conf')} />
          </Stack>
        )

      case 'keydb':
        return (
          <Stack gap="md">
            <Divider label="KeyDB Configuration" />
            <PasswordInput label="KeyDB Password" placeholder="Enter password" required {...form.getInputProps('keydb_password')} />
            <Textarea label="KeyDB Config (Optional)" placeholder="KeyDB configuration" rows={3} {...form.getInputProps('keydb_conf')} />
          </Stack>
        )

      case 'mariadb':
        return (
          <Stack gap="md">
            <Divider label="MariaDB Configuration" />
            <PasswordInput label="Root Password" placeholder="Enter root password" required {...form.getInputProps('mariadb_root_password')} />
            <TextInput label="MariaDB User" placeholder="user" required {...form.getInputProps('mariadb_user')} />
            <PasswordInput label="MariaDB Password" placeholder="Enter password" required {...form.getInputProps('mariadb_password')} />
            <TextInput label="MariaDB Database" placeholder="database" required {...form.getInputProps('mariadb_database')} />
            <Textarea label="MariaDB Config (Optional)" placeholder="MariaDB configuration" rows={3} {...form.getInputProps('mariadb_conf')} />
          </Stack>
        )

      case 'mysql':
        return (
          <Stack gap="md">
            <Divider label="MySQL Configuration" />
            <PasswordInput label="Root Password" placeholder="Enter root password" required {...form.getInputProps('mysql_root_password')} />
            <TextInput label="MySQL User" placeholder="user" required {...form.getInputProps('mysql_user')} />
            <PasswordInput label="MySQL Password" placeholder="Enter password" required {...form.getInputProps('mysql_password')} />
            <TextInput label="MySQL Database" placeholder="database" required {...form.getInputProps('mysql_database')} />
            <Textarea label="MySQL Config (Optional)" placeholder="MySQL configuration" rows={3} {...form.getInputProps('mysql_conf')} />
          </Stack>
        )

      default:
        return null
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Create Database" size="lg">
      <Stack gap="md">
        {selectedTemplate && (
          <Alert color="blue" title="Selected Template">
            <Text size="sm">
              <strong>{selectedTemplate.name}</strong>: {selectedTemplate.description}
            </Text>
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Database Name" placeholder="Enter database name" required {...form.getInputProps('name')} />

            <Textarea label="Description" placeholder="Enter database description" rows={3} {...form.getInputProps('description')} />

            {renderDatabaseSpecificFields()}

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={form.values.name === ''}>
                Create Database
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  )
}
