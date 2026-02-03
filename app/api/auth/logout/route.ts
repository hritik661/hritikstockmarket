import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get("session_token")
    const token = cookie?.value

    const useDatabase = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy')
    if (useDatabase && token) {
      try {
        const sql = neon(process.env.DATABASE_URL!)
        await sql`DELETE FROM user_sessions WHERE session_token = ${token}`
      } catch (err) {
        console.warn("/api/auth/logout: failed to delete session:", err)
      }
    }

    const res = NextResponse.json({ success: true })
    // clear cookie
    res.cookies.set('session_token', '', { httpOnly: true, path: '/', maxAge: 0 })
    return res
  } catch (err) {
    console.error("/api/auth/logout error:", err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
