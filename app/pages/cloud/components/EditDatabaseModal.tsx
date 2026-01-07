import { Button, Divider, Group, Modal, PasswordInput, Stack, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useEffect } from 'react'
import useAiStore from '~/lib/store/aiStore'
import { useDatabaseStore, type UserDatabase } from '~/lib/store/databaseStore'

interface EditDatabaseModalProps {
  opened: boolean
  onClose: () => void
  database: UserDatabase | null
}

export default function EditDatabaseModal({ opened, onClose, database }: EditDatabaseModalProps) {
  const { updateDatabaseViaCoolify } = useDatabaseStore()
  const { getAuthToken } = useAiStore()

  const form = useForm({
    initialValues: {
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
      name: (value) => (!value ? 'Name is required' : null),
    },
  })

  useEffect(() => {
    if (database) {
      const config = database.config || {}
      form.setValues({
        name: (database as any)?.name || (database as any)?.response?.name || '',
        description: (database as any)?.description || (database as any)?.response?.description || '',
        // PostgreSQL fields
        postgres_user: config.postgres_user || '',
        postgres_password: config.postgres_password || '',
        postgres_db: config.postgres_db || '',
        postgres_initdb_args: config.postgres_initdb_args || '',
        postgres_host_auth_method: config.postgres_host_auth_method || '',
        postgres_conf: config.postgres_conf || '',
        // MongoDB fields
        mongo_conf: config.mongo_conf || '',
        mongo_initdb_root_username: config.mongo_initdb_root_username || '',
        // ClickHouse fields
        clickhouse_admin_user: config.clickhouse_admin_user || '',
        clickhouse_admin_password: config.clickhouse_admin_password || '',
        // DragonFly fields
        dragonfly_password: config.dragonfly_password || '',
        // Redis fields
        redis_password: config.redis_password || '',
        redis_conf: config.redis_conf || '',
        // KeyDB fields
        keydb_password: config.keydb_password || '',
        keydb_conf: config.keydb_conf || '',
        // MariaDB fields
        mariadb_conf: config.mariadb_conf || '',
        mariadb_root_password: config.mariadb_root_password || '',
        mariadb_user: config.mariadb_user || '',
        mariadb_password: config.mariadb_password || '',
        mariadb_database: config.mariadb_database || '',
        // MySQL fields
        mysql_root_password: config.mysql_root_password || '',
        mysql_password: config.mysql_password || '',
        mysql_user: config.mysql_user || '',
        mysql_database: config.mysql_database || '',
        mysql_conf: config.mysql_conf || '',
      })
    }
  }, [database])

  // Helper function to filter out empty/undefined fields
  const filterEmptyFields = (obj: any) => {
    const filtered: any = {}
    Object.keys(obj).forEach((key) => {
      const value = obj[key]
      if (value !== undefined && value !== null && value !== '') {
        filtered[key] = value
      }
    })
    return filtered
  }

  // Filter database data to only include fields relevant to the specific database type
  const filterDatabaseDataByType = (data: any, dbType: string) => {
    const baseFields = {
      name: data.name,
      description: data.description,
    }

    switch (dbType) {
      case 'postgresql':
        return filterEmptyFields({
          ...baseFields,
          postgres_user: data.postgres_user,
          postgres_password: data.postgres_password,
          postgres_db: data.postgres_db,
          postgres_initdb_args: data.postgres_initdb_args,
          postgres_host_auth_method: data.postgres_host_auth_method,
          postgres_conf: data.postgres_conf,
        })

      case 'mongodb':
        return filterEmptyFields({
          ...baseFields,
          mongo_conf: data.mongo_conf,
          mongo_initdb_root_username: data.mongo_initdb_root_username,
        })

      case 'clickhouse':
        return filterEmptyFields({
          ...baseFields,
          clickhouse_admin_user: data.clickhouse_admin_user,
          clickhouse_admin_password: data.clickhouse_admin_password,
        })

      case 'dragonfly':
        return filterEmptyFields({
          ...baseFields,
          dragonfly_password: data.dragonfly_password,
        })

      case 'redis':
        return filterEmptyFields({
          ...baseFields,
          redis_password: data.redis_password,
          redis_conf: data.redis_conf,
        })

      case 'keydb':
        return filterEmptyFields({
          ...baseFields,
          keydb_password: data.keydb_password,
          keydb_conf: data.keydb_conf,
        })

      case 'mariadb':
        return filterEmptyFields({
          ...baseFields,
          mariadb_conf: data.mariadb_conf,
          mariadb_root_password: data.mariadb_root_password,
          mariadb_user: data.mariadb_user,
          mariadb_password: data.mariadb_password,
          mariadb_database: data.mariadb_database,
        })

      case 'mysql':
        return filterEmptyFields({
          ...baseFields,
          mysql_root_password: data.mysql_root_password,
          mysql_password: data.mysql_password,
          mysql_user: data.mysql_user,
          mysql_database: data.mysql_database,
          mysql_conf: data.mysql_conf,
        })

      default:
        return baseFields
    }
  }

  const handleSubmit = async (values: typeof form.values) => {
    if (!database?.database_uuid || !database?.type) return

    try {
      // Filter the data to only include fields relevant to the specific database type
      const filteredData = filterDatabaseDataByType(values, database.type)

      const success = await updateDatabaseViaCoolify(database.database_uuid, filteredData, getAuthToken())
      if (success) {
        form.reset()
        onClose()
      }
    } catch (error) {
      console.error('Error updating database:', error)
    }
  }

  const renderDatabaseSpecificFields = () => {
    if (!database?.type) return null

    const dbType = database.type.toLowerCase()

    switch (dbType) {
      case 'postgresql':
        return (
          <Stack gap="md">
            <Divider label="PostgreSQL Configuration" />
            <TextInput label="PostgreSQL User" placeholder="postgres" {...form.getInputProps('postgres_user')} />
            <PasswordInput label="PostgreSQL Password" placeholder="Enter password" {...form.getInputProps('postgres_password')} />
            <TextInput label="PostgreSQL Database" placeholder="postgres" {...form.getInputProps('postgres_db')} />
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
            <TextInput label="Admin User" placeholder="admin" {...form.getInputProps('clickhouse_admin_user')} />
            <PasswordInput label="Admin Password" placeholder="Enter password" {...form.getInputProps('clickhouse_admin_password')} />
          </Stack>
        )

      case 'dragonfly':
        return (
          <Stack gap="md">
            <Divider label="DragonFly Configuration" />
            <PasswordInput label="DragonFly Password" placeholder="Enter password" {...form.getInputProps('dragonfly_password')} />
          </Stack>
        )

      case 'redis':
        return (
          <Stack gap="md">
            <Divider label="Redis Configuration" />
            <PasswordInput label="Redis Password" placeholder="Enter password" {...form.getInputProps('redis_password')} />
            <Textarea label="Redis Config (Optional)" placeholder="Redis configuration" rows={3} {...form.getInputProps('redis_conf')} />
          </Stack>
        )

      case 'keydb':
        return (
          <Stack gap="md">
            <Divider label="KeyDB Configuration" />
            <PasswordInput label="KeyDB Password" placeholder="Enter password" {...form.getInputProps('keydb_password')} />
            <Textarea label="KeyDB Config (Optional)" placeholder="KeyDB configuration" rows={3} {...form.getInputProps('keydb_conf')} />
          </Stack>
        )

      case 'mariadb':
        return (
          <Stack gap="md">
            <Divider label="MariaDB Configuration" />
            <PasswordInput label="Root Password" placeholder="Enter root password" {...form.getInputProps('mariadb_root_password')} />
            <TextInput label="MariaDB User" placeholder="user" {...form.getInputProps('mariadb_user')} />
            <PasswordInput label="MariaDB Password" placeholder="Enter password" {...form.getInputProps('mariadb_password')} />
            <TextInput label="MariaDB Database" placeholder="database" {...form.getInputProps('mariadb_database')} />
            <Textarea label="MariaDB Config (Optional)" placeholder="MariaDB configuration" rows={3} {...form.getInputProps('mariadb_conf')} />
          </Stack>
        )

      case 'mysql':
        return (
          <Stack gap="md">
            <Divider label="MySQL Configuration" />
            <PasswordInput label="Root Password" placeholder="Enter root password" {...form.getInputProps('mysql_root_password')} />
            <TextInput label="MySQL User" placeholder="user" {...form.getInputProps('mysql_user')} />
            <PasswordInput label="MySQL Password" placeholder="Enter password" {...form.getInputProps('mysql_password')} />
            <TextInput label="MySQL Database" placeholder="database" {...form.getInputProps('mysql_database')} />
            <Textarea label="MySQL Config (Optional)" placeholder="MySQL configuration" rows={3} {...form.getInputProps('mysql_conf')} />
          </Stack>
        )

      default:
        return null
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Database" size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput label="Database Name" placeholder="Enter database name" required {...form.getInputProps('name')} />

          <TextInput label="Description" placeholder="Enter database description" {...form.getInputProps('description')} />

          {renderDatabaseSpecificFields()}

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={form.values.name === ''}>
              Update Database
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
