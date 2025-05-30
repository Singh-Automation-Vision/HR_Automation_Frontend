"use client"
import Header from "@/components/header"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id?: string | number
  name?: string
  email?: string
  role?: string
  [key: string]: any // For any other properties
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user")

    if (!userData) {
      // No user data found, redirect to login
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("user")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

          {user && (
            <div>
              <p className="text-gray-700">Welcome, {user.name || user.email}!</p>
              <p className="mt-4 text-gray-600">You have successfully logged in.</p>

              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h2 className="text-lg font-medium mb-2">User Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(user).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium capitalize w-24">{key}:</span>
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
