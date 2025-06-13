"use client"

import { useRouter, usePathname } from "next/navigation"
import { Home, LogOut, Package, Users, Calendar } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    console.log("🔍 Raw userData from localStorage:", userData)

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        console.log("👤 Parsed user object:", parsedUser)
        console.log("📧 User email:", parsedUser.email)
        console.log("👤 User username:", parsedUser.username)
        console.log("🔑 Available user keys:", Object.keys(parsedUser))
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  // Check if current user is admin - check multiple possible fields and log everything
  console.log("🔍 Header - Raw user object:", user)
  console.log("🔍 Header - User keys:", user ? Object.keys(user) : "No user")
  console.log("🔍 Header - user.username:", user?.username)
  console.log("🔍 Header - user.email:", user?.email)
  console.log("🔍 Header - user.Username:", user?.Username)

  const isAdmin =
    user &&
    (user.username === "admin" ||
      user.email === "admin" ||
      user.Username === "admin" ||
      user.name === "admin" ||
      String(user.username).toLowerCase() === "admin" ||
      String(user.email).toLowerCase() === "admin")

  console.log("🔍 Header - isAdmin result:", isAdmin)

  console.log("🔍 Current user:", user)
  console.log("🔍 Is admin check:", isAdmin)
  console.log("🔍 Username:", user?.username)
  console.log("🔍 Email:", user?.email)
  console.log("🔍 Username (capital U):", user?.Username)

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  const isActive = (path: string) => {
    return (
      pathname === path ||
      (path === "/dashboard" && (pathname === "/dashboard" || pathname === "/admin/dashboard")) ||
      (path === "/hr-management" && pathname === "/hr-management") ||
      (path === "/inventory" && pathname === "/inventory") ||
      (path === "/meetings" && pathname === "/meetings")
    )
  }

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/dashboard">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-14%20at%2018.06.34_25e0223d.jpg-L10RJBT7mUpo0enkPKQdmMt9wrxwx0.jpeg"
              alt="Singh Automation Logo"
              className="h-10 object-contain"
            />
          </Link>
        </div>

        <nav className="flex items-center space-x-6">
          <Link
            href="/dashboard"
            className={`flex items-center text-sm font-medium transition-colors ${
              isActive("/dashboard") ? "text-[#00ff00]" : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <Home className="w-4 h-4 mr-1" />
            <span>Home</span>
          </Link>

          {/* Show Inventory only for non-admin users (hide for admin) */}
          {!isAdmin && (
            <Link
              href="/inventory"
              className={`flex items-center text-sm font-medium transition-colors ${
                isActive("/inventory") ? "text-[#00ff00]" : "text-gray-700 hover:text-gray-900"
              }`}
            >
              <Package className="w-4 h-4 mr-1" />
              <span>Inventory</span>
            </Link>
          )}

          {/* Show Meetings only for admin users */}
          {isAdmin && (
            <Link
              href="/meetings"
              className={`flex items-center text-sm font-medium transition-colors ${
                isActive("/meetings") ? "text-[#00ff00]" : "text-gray-700 hover:text-gray-900"
              }`}
            >
              <Calendar className="w-4 h-4 mr-1" />
              <span>Meetings</span>
            </Link>
          )}

          {/* Show HR Management for admin users */}
          {isAdmin && (
            <Link
              href="/hr-management"
              className={`flex items-center text-sm font-medium transition-colors ${
                isActive("/hr-management") ? "text-[#00ff00]" : "text-gray-700 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4 mr-1" />
              <span>HR Management</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
