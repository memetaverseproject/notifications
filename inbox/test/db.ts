import { NotificationDb } from '@notifications/common'
import SQL from 'sql-template-strings'
import { AppComponents } from '../src/types'

export async function createNotification(
  { pg }: Pick<AppComponents, 'pg'>,
  notification: NotificationDb
): Promise<string> {
  const queryResult = await pg.query(SQL`
      INSERT INTO notifications (event_key, type, address, metadata, timestamp, created_at, updated_at)
      VALUES (${notification.event_key},
              ${notification.type},
              ${notification.address?.toLowerCase()},
              ${notification.metadata}::jsonb,
              ${notification.timestamp},
              ${notification.created_at},
              ${notification.updated_at})
      RETURNING id;
  `)
  notification.id = queryResult.rows[0].id
  return notification.id
}

export async function findNotifications(
  { pg }: Pick<AppComponents, 'pg'>,
  notificationIds: string[]
): Promise<NotificationDb[]> {
  const queryResult = await pg.query<NotificationDb>(SQL`
      SELECT id,
             event_key,
             type,
             n.address  as address,
             metadata,
             timestamp,
             n.read_at  as read_at,
             created_at,
             updated_at,
             br.address AS broadcast_address,
             br.read_at AS broadcast_read_at
      FROM notifications n
               LEFT JOIN broadcast_read br ON n.id = br.notification_id
      WHERE n.id = ANY (${notificationIds})
  `)

  return queryResult.rows
}

export async function findCursor({ pg }: Pick<AppComponents, 'pg'>, cursorName: string) {
  const result = await pg.query(
    `SELECT *
         FROM cursors
         WHERE id = '${cursorName}'`
  )
  return result.rows[0]
}

export async function createCursor({ pg }: Pick<AppComponents, 'pg'>, cursorName: string) {
  await pg.query(
    SQL`INSERT INTO cursors (id, last_successful_run_at, created_at, updated_at)
            VALUES (${cursorName}, ${Date.now()}, ${Date.now()}, ${Date.now()})`
  )
}
