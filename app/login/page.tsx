"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { API_BASE_URL } from "@/lib/api-config"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showServerMessage, setShowServerMessage] = useState(false)
  const router = useRouter()

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  useEffect(() => {
    let timer: NodeJS.Timeout
    let refreshTimer: NodeJS.Timeout

    if (isLoading) {
      // Show server starting message after 3 seconds
      timer = setTimeout(() => {
        setShowServerMessage(true)

        // Auto refresh after 10 seconds (without showing countdown)
        refreshTimer = setTimeout(() => {
          window.location.reload()
        }, 10000)
      }, 3000)
    }

    return () => {
      if (timer) clearTimeout(timer)
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setShowServerMessage(false)

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Store the user data in localStorage
      localStorage.setItem("user", JSON.stringify(data.user))

      // Check if user is admin and redirect accordingly
      if (email === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "Failed to login. Please try again.")
    } finally {
      setIsLoading(false)
      setShowServerMessage(false)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg overflow-hidden">
        <div className="w-full bg-white py-6 flex justify-center border-b">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-14%20at%2018.06.34_25e0223d.jpg-L10RJBT7mUpo0enkPKQdmMt9wrxwx0.jpeg"
            alt="Singh Automation Logo"
            className="h-12 object-contain"
          />
        </div>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">{error}</div>
          )}

          {showServerMessage && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm text-center">
              <div className="flex items-center justify-center mb-2">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                <span className="font-medium">The server is starting Refresh in a few seconds</span>
              </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="mt-2 text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Refresh Now
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                disabled={isLoading}
                required
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#39FF14] hover:bg-[#32E512] text-black font-medium h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {showServerMessage ? "Server Starting..." : "Logging in..."}
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
