import { NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/api-config"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Forward the request to the actual API
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Authentication failed" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
