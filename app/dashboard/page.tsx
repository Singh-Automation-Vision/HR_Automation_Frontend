"use client"
import Header from "@/components/header"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api-config"

interface User {
  id?: string | number
  name?: string
  email?: string
  role?: string
  Username?: string // Note the capital 'U' to match the actual data structure
  [key: string]: any // For any other properties
}

interface EmailStatusType {
  oneOnOne: { success: boolean; message: string } | null
  performance: { success: boolean; message: string } | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingOneOnOne, setSendingOneOnOne] = useState(false)
  const [sendingPerformance, setSendingPerformance] = useState(false)
  const [emailStatus, setEmailStatus] = useState<EmailStatusType>({
    oneOnOne: null,
    performance: null,
  })
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
      console.log("Current user:", parsedUser) // Log the user object to see its structure
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("user")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  const sendEmailReminder = async (type: "oneonone" | "performance") => {
    try {
      const endpoint =
        type === "oneonone"
          ? `${API_BASE_URL}/api/monthly-oneonone-reminder`
          : `${API_BASE_URL}/api/monthly-performance-reminder`

      if (type === "oneonone") {
        setSendingOneOnOne(true)
        setEmailStatus((prev) => ({ ...prev, oneOnOne: null }))
      } else {
        setSendingPerformance(true)
        setEmailStatus((prev) => ({ ...prev, performance: null }))
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        if (type === "oneonone") {
          setEmailStatus((prev) => ({
            ...prev,
            oneOnOne: { success: true, message: "One-on-One email reminders sent successfully!" },
          }))
        } else {
          setEmailStatus((prev) => ({
            ...prev,
            performance: { success: true, message: "Performance email reminders sent successfully!" },
          }))
        }
      } else {
        if (type === "oneonone") {
          setEmailStatus((prev) => ({
            ...prev,
            oneOnOne: { success: false, message: data.error || "Failed to send One-on-One email reminders." },
          }))
        } else {
          setEmailStatus((prev) => ({
            ...prev,
            performance: { success: false, message: data.error || "Failed to send Performance email reminders." },
          }))
        }
      }
    } catch (error) {
      console.error(`Error sending ${type} email reminders:`, error)
      if (type === "oneonone") {
        setEmailStatus((prev) => ({
          ...prev,
          oneOnOne: { success: false, message: "An error occurred while sending One-on-One email reminders." },
        }))
      } else {
        setEmailStatus((prev) => ({
          ...prev,
          performance: { success: false, message: "An error occurred while sending Performance email reminders." },
        }))
      }
    } finally {
      if (type === "oneonone") {
        setSendingOneOnOne(false)
      } else {
        setSendingPerformance(false)
      }
    }
  }

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

  // Check if the current user is one of the special users - note the capital 'U' in Username
  const specialUsers = ["rohini", "sudharshan", "naveen"]
  const isSpecialUser =
    user &&
    ((user.Username && specialUsers.includes(user.Username.toLowerCase())) ||
      (user.name && specialUsers.includes(user.name.toLowerCase())) ||
      (user.email && specialUsers.includes(user.email.toLowerCase())))

  console.log("Is special user:", isSpecialUser)
  console.log("Username check:", user?.Username, specialUsers.includes((user?.Username || "").toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

          {user && (
            <div>
              <p className="text-gray-700">Welcome, {user.Username || user.name || user.email}!</p>
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

              {/* Special buttons for specific users */}
              {isSpecialUser && (
                <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                  <h3 className="text-lg font-medium mb-3 text-blue-800">Email Reminders</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <button
                        onClick={() => sendEmailReminder("oneonone")}
                        disabled={sendingOneOnOne}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                      >
                        {sendingOneOnOne ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Sending...
                          </span>
                        ) : (
                          "Send One-on-One Email Reminders"
                        )}
                      </button>
                      {emailStatus.oneOnOne && (
                        <div
                          className={`mt-2 text-sm ${emailStatus.oneOnOne.success ? "text-green-600" : "text-red-600"}`}
                        >
                          {emailStatus.oneOnOne.message}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() => sendEmailReminder("performance")}
                        disabled={sendingPerformance}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                      >
                        {sendingPerformance ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Sending...
                          </span>
                        ) : (
                          "Send Performance Email Reminders"
                        )}
                      </button>
                      {emailStatus.performance && (
                        <div
                          className={`mt-2 text-sm ${emailStatus.performance.success ? "text-green-600" : "text-red-600"}`}
                        >
                          {emailStatus.performance.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
