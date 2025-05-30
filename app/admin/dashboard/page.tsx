"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"

interface User {
  id?: string | number
  name?: string
  email?: string
  role?: string
  [key: string]: any
}

export default function AdminDashboardPage() {
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

      // Check if user is admin
      if (parsedUser.email !== "admin") {
        router.push("/dashboard")
        return
      }

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
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

          {user && (
            <div>
              <p className="text-gray-700">Welcome, Admin!</p>
              <p className="mt-4 text-gray-600">You have successfully logged in as an administrator.</p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <h3 className="font-medium text-blue-700 mb-2">User Management</h3>
                  <p className="text-sm text-blue-600 mb-4">Manage users, roles and permissions</p>
                  <Button variant="outline" className="w-full justify-start text-blue-600 border-blue-200">
                    Manage Users
                  </Button>
                </div>

                <div className="bg-green-50 p-4 rounded-md border border-green-100">
                  <h3 className="font-medium text-green-700 mb-2">Reports</h3>
                  <p className="text-sm text-green-600 mb-4">View and generate system reports</p>
                  <Button variant="outline" className="w-full justify-start text-green-600 border-green-200">
                    View Reports
                  </Button>
                </div>

                <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                  <h3 className="font-medium text-purple-700 mb-2">Settings</h3>
                  <p className="text-sm text-purple-600 mb-4">Configure system settings</p>
                  <Button variant="outline" className="w-full justify-start text-purple-600 border-purple-200">
                    System Settings
                  </Button>
                </div>

                <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                  <h3 className="font-medium text-amber-700 mb-2">Logs</h3>
                  <p className="text-sm text-amber-600 mb-4">View system logs and activity</p>
                  <Button variant="outline" className="w-full justify-start text-amber-600 border-amber-200">
                    View Logs
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
