import { getDb } from '@/db/client';
import type { ConnectedAccount, ConnectedAccountStatus } from '@/db/types';

type ConnectedAccountRow = Omit<ConnectedAccount, 'scopes'> & {
  scopes_json: string;
};

function fromRow(row: ConnectedAccountRow): ConnectedAccount {
  let scopes: unknown;
  try {
    scopes = JSON.parse(row.scopes_json);
  } catch {
    throw new Error('Stored connected-account scopes are invalid.');
  }
  if (!Array.isArray(scopes) || !scopes.every((scope) => typeof scope === 'string')) {
    throw new Error('Stored connected-account scopes are invalid.');
  }
  return {
    provider: row.provider,
    account_id: row.account_id,
    email: row.email,
    display_name: row.display_name,
    scopes,
    status: row.status,
    connected_at: row.connected_at,
  };
}

export async function getConnectedAccount(provider: string): Promise<ConnectedAccount | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ConnectedAccountRow>(
    `SELECT * FROM connected_accounts WHERE provider = ?;`,
    provider,
  );
  return row ? fromRow(row) : null;
}

export async function saveConnectedAccount(
  account: Omit<ConnectedAccount, 'connected_at'> & { connected_at?: string },
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO connected_accounts
      (provider, account_id, email, display_name, scopes_json, status, connected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(provider) DO UPDATE SET
       account_id = excluded.account_id,
       email = excluded.email,
       display_name = excluded.display_name,
       scopes_json = excluded.scopes_json,
       status = excluded.status,
       connected_at = excluded.connected_at;`,
    account.provider,
    account.account_id,
    account.email,
    account.display_name,
    JSON.stringify(account.scopes),
    account.status,
    account.connected_at ?? new Date().toISOString(),
  );
}

export async function updateConnectedAccountStatus(
  provider: string,
  status: ConnectedAccountStatus,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE connected_accounts SET status = ? WHERE provider = ?;`, status, provider);
}

export async function deleteConnectedAccount(provider: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM connected_accounts WHERE provider = ?;`, provider);
}
