import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"

// Enable WebSocket for serverless environments
neonConfig.webSocketConstructor = ws

let pool: Pool | null = null

export function getPool(): Pool {
  if (pool) return pool
  
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment")
  }

  pool = new Pool({ connectionString })
  return pool
}

export async function query(sql: string, params: any[] = []): Promise<any> {
  const p = getPool()
  const result = await p.query(sql, params)
  return result.rows
}

export async function queryOne(sql: string, params: any[] = []): Promise<any | null> {
  const rows = await query(sql, params)
  return rows[0] || null
}

export async function execute(sql: string, params: any[] = []): Promise<{ rowCount: number }> {
  const p = getPool()
  const result = await p.query(sql, params)
  return { rowCount: result.rowCount || 0 }
}
