"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const userData = localStorage.getItem("user")

    if (userData) {
      try {
        const user = JSON.parse(userData)
        // Redirect based on user type
        if (user.email === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        // If there's an error parsing user data, clear it and go to login
        localStorage.removeItem("user")
        router.push("/login")
      }
    } else {
      // No user data, redirect to login
      router.push("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-700">Loading...</p>
      </div>
    </div>
  )
}
