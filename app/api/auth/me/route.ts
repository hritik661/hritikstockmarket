import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get("session_token")
    const token = cookie?.value
    if (!token) return NextResponse.json({ success: false }, { status: 401 })

    const useDatabase = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')
    if (!useDatabase) return NextResponse.json({ success: false }, { status: 401 })

    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`
      SELECT u.id, u.email, u.name, u.balance, u.is_prediction_paid
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ${token}
      LIMIT 1
    `

    if (!rows || rows.length === 0) return NextResponse.json({ success: false }, { status: 401 })

    const u = rows[0]
    return NextResponse.json({ success: true, user: { id: u.id, email: u.email, name: u.name, balance: Number(u.balance || 0), isPredictionPaid: !!u.is_prediction_paid } })
  } catch (err) {
    console.error("/api/auth/me error:", err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
