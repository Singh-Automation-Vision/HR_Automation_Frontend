"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Users, Star, ChevronRight, ArrowLeft, Check } from "lucide-react"
import Header from "@/components/header"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/api-config"

interface User {
  id?: string | number
  name?: string
  email?: string
  role?: string
  [key: string]: any
}

interface Employee {
  name: string
  email: string
  password: string
  country: string
  manager: string
  manager_email: string
  designation: string
  month: string
  year: string
  isCompleted: boolean
  notes: string
}

interface Manager {
  name: string
  email: string
  employees: Employee[]
}

interface EmployeeStatus {
  name: string
  designation: string
  status: string
}

interface EmployeeStatusResponse {
  success: boolean
  manager: string
  month: string
  year: string
  employees: EmployeeStatus[]
}

interface OneOnOneMeeting {
  name: string
  email: string
  password: string
  country: string
  manager: string
  manager_email: string
  designation: string
  month: string
  year: string
  isCompleted: boolean
  notes: string
}

interface PerformanceMeeting {
  name: string
  email: string
  password: string
  country: string
  manager: string
  manager_email: string
  designation: string
  month: string
  year: string
  isCompleted: boolean
  notes: string
}

interface EmployeeData {
  name: string
  designation: string
}

interface ManagerEmployeeMap {
  [managerName: string]: EmployeeData[]
}

interface ApiResponse {
  manager_employee_map: ManagerEmployeeMap
  success: boolean
}

export default function MeetingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [managers, setManagers] = useState<Manager[]>([])
  const [performanceManagers, setPerformanceManagers] = useState<Manager[]>([])
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null)
  const [selectedPerformanceManager, setSelectedPerformanceManager] = useState<Manager | null>(null)
  const [oneOnOneMeetings, setOneOnOneMeetings] = useState<OneOnOneMeeting[]>([])
  const [performanceMeetings, setPerformanceMeetings] = useState<PerformanceMeeting[]>([])
  const [loadingMeetings, setLoadingMeetings] = useState(false)
  const [loadingPerformanceMeetings, setLoadingPerformanceMeetings] = useState(false)
  const [performanceMeetingsError, setPerformanceMeetingsError] = useState<string | null>(null)

  // Employee status states
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([])
  const [loadingEmployeeStatus, setLoadingEmployeeStatus] = useState(false)

  // Add these new state variables after the existing employee status states
  const [performanceEmployeeStatuses, setPerformanceEmployeeStatuses] = useState<EmployeeStatus[]>([])
  const [loadingPerformanceEmployeeStatus, setLoadingPerformanceEmployeeStatus] = useState<false>([])

  // Add these new state variables after the existing state variables
  const [allManagersStatus, setAllManagersStatus] = useState<Map<string, EmployeeStatus[]>>(new Map())
  const [allPerformanceManagersStatus, setAllPerformanceManagersStatus] = useState<Map<string, EmployeeStatus[]>>(
    new Map(),
  )
  const [loadingAllManagersStatus, setLoadingAllManagersStatus] = useState(false)
  const [loadingAllPerformanceManagersStatus, setLoadingAllPerformanceManagersStatus] = useState(false)

  // Calendar view states for One-on-One
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString("default", { month: "long" }))
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  // Calendar view states for Performance meetings
  const [selectedPerformanceMonth, setSelectedPerformanceMonth] = useState<string>(
    new Date().toLocaleString("default", { month: "long" }),
  )
  const [selectedPerformanceYear, setSelectedPerformanceYear] = useState<string>(new Date().getFullYear().toString())

  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableMonths] = useState<string[]>([
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ])

  // Even months only for performance meetings
  const [evenMonths] = useState<string[]>(["February", "April", "June", "August", "October", "December"])

  const router = useRouter()
  const { toast } = useToast()

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Get user data from localStorage
    const userData = localStorage.getItem("user")

    if (!userData) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)

      // Check if user is admin
      const isUserAdmin =
        parsedUser &&
        (parsedUser.username === "admin" ||
          parsedUser.email === "admin" ||
          parsedUser.Username === "admin" ||
          parsedUser.name === "admin" ||
          String(parsedUser.username).toLowerCase() === "admin" ||
          String(parsedUser.email).toLowerCase() === "admin")

      if (!isUserAdmin) {
        console.log("❌ Non-admin user trying to access meetings")
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
  }, [router, isClient])

  useEffect(() => {
    if (user && isClient) {
      fetchOneOnOneMeetings()
      fetchPerformanceMeetings()

      // Set available years (from 2020 to 2040)
      const years = []
      for (let year = 2020; year <= 2040; year++) {
        years.push(year.toString())
      }
      setAvailableYears(years)
    }
  }, [user, isClient])

  // Fetch employee status when manager is selected or month/year changes
  useEffect(() => {
    if (selectedManager && isClient) {
      fetchEmployeeStatus(selectedManager.name, selectedMonth, selectedYear)
    }
  }, [selectedManager, selectedMonth, selectedYear, isClient])

  // Add this useEffect after the existing one for one-on-one employee status
  // Fetch performance employee status when manager is selected or month/year changes
  useEffect(() => {
    if (selectedPerformanceManager && isClient) {
      fetchPerformanceEmployeeStatus(selectedPerformanceManager.name, selectedPerformanceMonth, selectedPerformanceYear)
    }
  }, [selectedPerformanceManager, selectedPerformanceMonth, selectedPerformanceYear, isClient])

  // Add this useEffect to fetch status for all managers when the page loads
  // Add this after the existing useEffects
  useEffect(() => {
    if (user && isClient && managers.length > 0) {
      fetchAllManagersStatus(selectedMonth, selectedYear)
    }
  }, [user, isClient, managers, selectedMonth, selectedYear])

  // Add this useEffect to fetch status for all performance managers when the page loads
  useEffect(() => {
    if (user && isClient && performanceManagers.length > 0) {
      fetchAllPerformanceManagersStatus(selectedPerformanceMonth, selectedPerformanceYear)
    }
  }, [user, isClient, performanceManagers, selectedPerformanceMonth, selectedPerformanceYear])

  const fetchEmployeeStatus = async (managerName: string, month: string, year: string) => {
    setLoadingEmployeeStatus(true)
    console.log(`🔄 Fetching employee status for ${managerName}, ${month} ${year}`)

    try {
      const response = await fetch(`${API_BASE_URL}/api/employee_status/${managerName}/${month}/${year}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📥 Employee status response status:", response.status)

      if (response.ok) {
        const data: EmployeeStatusResponse = await response.json()
        console.log("📥 Employee status raw data:", data)

        if (data.success && data.employees) {
          setEmployeeStatuses(data.employees)
          console.log(`✅ Employee statuses loaded: ${data.employees.length} employees`)
        } else {
          console.log("⚠️ Invalid employee status data structure")
          setEmployeeStatuses([])
        }
      } else {
        console.error("❌ Failed to fetch employee status")
        setEmployeeStatuses([])
      }
    } catch (error) {
      console.error("❌ Error fetching employee status:", error)
      setEmployeeStatuses([])
    } finally {
      setLoadingEmployeeStatus(false)
    }
  }

  // Add this new function after the fetchEmployeeStatus function
  const fetchPerformanceEmployeeStatus = async (managerName: string, month: string, year: string) => {
    setLoadingPerformanceEmployeeStatus(true)
    console.log(`🔄 Fetching performance employee status for ${managerName}, ${month} ${year}`)

    try {
      const response = await fetch(`${API_BASE_URL}/api/performance_status/${managerName}/${month}/${year}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📥 Performance employee status response status:", response.status)

      if (response.ok) {
        const data: EmployeeStatusResponse = await response.json()
        console.log("📥 Performance employee status raw data:", data)

        if (data.success && data.employees) {
          setPerformanceEmployeeStatuses(data.employees)
          console.log(`✅ Performance employee statuses loaded: ${data.employees.length} employees`)
        } else {
          console.log("⚠️ Invalid performance employee status data structure")
          setPerformanceEmployeeStatuses([])
        }
      } else {
        console.error("❌ Failed to fetch performance employee status")
        setPerformanceEmployeeStatuses([])
      }
    } catch (error) {
      console.error("❌ Error fetching performance employee status:", error)
      setPerformanceEmployeeStatuses([])
    } finally {
      setLoadingPerformanceEmployeeStatus(false)
    }
  }

  // Add this function to fetch status for all managers
  const fetchAllManagersStatus = async (month: string, year: string) => {
    setLoadingAllManagersStatus(true)
    console.log(`🔄 Fetching status for all managers for ${month} ${year}`)

    const statusMap = new Map<string, EmployeeStatus[]>()
    const managerPromises = managers.map(async (manager) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/employee_status/${manager.name}/${month}/${year}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data: EmployeeStatusResponse = await response.json()
          if (data.success && data.employees) {
            statusMap.set(manager.name, data.employees)
            console.log(`✅ Status loaded for ${manager.name}: ${data.employees.length} employees`)
          }
        } else {
          console.error(`❌ Failed to fetch status for ${manager.name}`)
        }
      } catch (error) {
        console.error(`❌ Error fetching status for ${manager.name}:`, error)
      }
    })

    await Promise.all(managerPromises)
    setAllManagersStatus(statusMap)
    setLoadingAllManagersStatus(false)
  }

  // Add this function to fetch status for all performance managers
  const fetchAllPerformanceManagersStatus = async (month: string, year: string) => {
    setLoadingAllPerformanceManagersStatus(true)
    console.log(`🔄 Fetching status for all performance managers for ${month} ${year}`)

    const statusMap = new Map<string, EmployeeStatus[]>()
    const managerPromises = performanceManagers.map(async (manager) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/performance_status/${manager.name}/${month}/${year}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data: EmployeeStatusResponse = await response.json()
          if (data.success && data.employees) {
            statusMap.set(manager.name, data.employees)
            console.log(`✅ Performance status loaded for ${manager.name}: ${data.employees.length} employees`)
          }
        } else {
          console.error(`❌ Failed to fetch performance status for ${manager.name}`)
        }
      } catch (error) {
        console.error(`❌ Error fetching performance status for ${manager.name}:`, error)
      }
    })

    await Promise.all(managerPromises)
    setAllPerformanceManagersStatus(statusMap)
    setLoadingAllPerformanceManagersStatus(false)
  }

  const fetchOneOnOneMeetings = async () => {
    setLoadingMeetings(true)
    console.log("🔄 Fetching one-on-one meetings...")

    try {
      const response = await fetch(`${API_BASE_URL}/api/one_on_one_meetings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📥 One-on-one meetings response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📥 One-on-one meetings raw data:", data)

        // Handle array of manager records
        if (Array.isArray(data)) {
          const managersMap = new Map<string, Employee[]>()

          data.forEach((record) => {
            if (record.success && record.manager && record.employees) {
              console.log(`📋 Processing manager: ${record.manager} with ${record.employees.length} employees`)

              if (!managersMap.has(record.manager)) {
                managersMap.set(record.manager, [])
              }

              const managerEmployees: Employee[] = record.employees.map((emp: any) => ({
                name: emp.name,
                email: "",
                password: "",
                country: "",
                manager: record.manager,
                manager_email: "",
                designation: emp.designation,
                month: record.month || selectedMonth,
                year: record.year?.toString() || selectedYear,
                isCompleted: emp.status === "completed",
                notes: "",
              }))

              managersMap.get(record.manager)?.push(...managerEmployees)
            }
          })

          const managersArray: Manager[] = Array.from(managersMap.entries()).map(([managerName, employees]) => ({
            name: managerName,
            email: "",
            employees: employees,
          }))

          console.log("📊 Managers extracted:", managersArray.length)
          setManagers(managersArray)
          setOneOnOneMeetings([])
        }
        // Handle single manager record
        else if (data.success && data.manager && data.employees) {
          const managerEmployees: Employee[] = data.employees.map((emp: any) => ({
            name: emp.name,
            email: "",
            password: "",
            country: "",
            manager: data.manager,
            manager_email: "",
            designation: emp.designation,
            month: data.month || selectedMonth,
            year: data.year?.toString() || selectedYear,
            isCompleted: emp.status === "completed",
            notes: "",
          }))

          const managersArray: Manager[] = [
            {
              name: data.manager,
              email: "",
              employees: managerEmployees,
            },
          ]

          console.log("📊 Single manager extracted:", managersArray.length)
          setManagers(managersArray)
          setOneOnOneMeetings([])
        }
        // Handle old format with manager_employee_map (fallback)
        else if (data.success && data.manager_employee_map) {
          const managersArray: Manager[] = []

          Object.entries(data.manager_employee_map).forEach(([managerName, employees]: [string, any]) => {
            console.log(`📋 Processing manager: ${managerName} with ${employees.length} employees`)

            const managerEmployees: Employee[] = employees.map((emp: any) => ({
              name: emp.name,
              email: "",
              password: "",
              country: "",
              manager: managerName,
              manager_email: "",
              designation: emp.designation,
              month: selectedMonth,
              year: selectedYear,
              isCompleted: false,
              notes: "",
            }))

            managersArray.push({
              name: managerName,
              email: "",
              employees: managerEmployees,
            })
          })

          console.log("📊 Managers extracted (old format):", managersArray.length)
          setManagers(managersArray)
          setOneOnOneMeetings([])
        } else {
          console.log("⚠️ Invalid data structure")
          setManagers([])
          setOneOnOneMeetings([])
        }
      } else {
        console.error("❌ Failed to fetch one-on-one meetings")
        setManagers([])
        setOneOnOneMeetings([])
      }
    } catch (error) {
      console.error("❌ Error fetching one-on-one meetings:", error)
      setManagers([])
      setOneOnOneMeetings([])
    } finally {
      setLoadingMeetings(false)
    }
  }

  const fetchPerformanceMeetings = async () => {
    setLoadingPerformanceMeetings(true)
    setPerformanceMeetingsError(null)
    console.log("🔄 Fetching performance meetings...")

    try {
      const response = await fetch(`${API_BASE_URL}/api/performance_meetings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📥 Performance meetings response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📥 Performance meetings raw data:", data)

        // Handle array of manager records
        if (Array.isArray(data)) {
          const managersMap = new Map<string, Employee[]>()

          data.forEach((record) => {
            if (record.success && record.manager && record.employees) {
              console.log(
                `📋 Processing performance manager: ${record.manager} with ${record.employees.length} employees`,
              )

              if (!managersMap.has(record.manager)) {
                managersMap.set(record.manager, [])
              }

              const managerEmployees: Employee[] = record.employees.map((emp: any) => ({
                name: emp.name,
                email: "",
                password: "",
                country: "",
                manager: record.manager,
                manager_email: "",
                designation: emp.designation,
                month: record.month || selectedPerformanceMonth,
                year: record.year?.toString() || selectedPerformanceYear,
                isCompleted: emp.status === "completed",
                notes: "",
              }))

              managersMap.get(record.manager)?.push(...managerEmployees)
            }
          })

          const performanceManagersArray: Manager[] = Array.from(managersMap.entries()).map(
            ([managerName, employees]) => ({
              name: managerName,
              email: "",
              employees: employees,
            }),
          )

          console.log("📊 Performance managers extracted:", performanceManagersArray.length)
          setPerformanceManagers(performanceManagersArray)
          setPerformanceMeetings([])
        }
        // Handle single manager record
        else if (data.success && data.manager && data.employees) {
          const managerEmployees: Employee[] = data.employees.map((emp: any) => ({
            name: emp.name,
            email: "",
            password: "",
            country: "",
            manager: data.manager,
            manager_email: "",
            designation: emp.designation,
            month: data.month || selectedPerformanceMonth,
            year: data.year?.toString() || selectedPerformanceYear,
            isCompleted: emp.status === "completed",
            notes: "",
          }))

          const performanceManagersArray: Manager[] = [
            {
              name: data.manager,
              email: "",
              employees: managerEmployees,
            },
          ]

          console.log("📊 Single performance manager extracted:", performanceManagersArray.length)
          setPerformanceManagers(performanceManagersArray)
          setPerformanceMeetings([])
        }
        // Handle old format with manager_employee_map (fallback)
        else if (data.success && data.manager_employee_map) {
          const performanceManagersArray: Manager[] = []

          Object.entries(data.manager_employee_map).forEach(([managerName, employees]: [string, any]) => {
            console.log(`📋 Processing performance manager: ${managerName} with ${employees.length} employees`)

            const managerEmployees: Employee[] = employees.map((emp: any) => ({
              name: emp.name,
              email: "",
              password: "",
              country: "",
              manager: managerName,
              manager_email: "",
              designation: emp.designation,
              month: selectedPerformanceMonth,
              year: selectedPerformanceYear,
              isCompleted: false,
              notes: "",
            }))

            performanceManagersArray.push({
              name: managerName,
              email: "",
              employees: managerEmployees,
            })
          })

          console.log("📊 Performance managers extracted (old format):", performanceManagersArray.length)
          setPerformanceManagers(performanceManagersArray)
          setPerformanceMeetings([])
        } else {
          console.log("⚠️ Invalid performance data structure")
          setPerformanceManagers([])
          setPerformanceMeetings([])
        }
      } else {
        console.error("❌ Failed to fetch performance meetings")
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`
        setPerformanceMeetingsError(errorMessage)
        setPerformanceManagers([])
        setPerformanceMeetings([])
      }
    } catch (error) {
      console.error("❌ Error fetching performance meetings:", error)
      const errorMessage = error instanceof Error ? error.message : "Network error"
      setPerformanceMeetingsError(errorMessage)
      setPerformanceManagers([])
      setPerformanceMeetings([])
    } finally {
      setLoadingPerformanceMeetings(false)
    }
  }

  const handleManagerClick = (manager: Manager) => {
    setSelectedManager(manager)
  }

  const handlePerformanceManagerClick = (manager: Manager) => {
    setSelectedPerformanceManager(manager)
  }

  // Update the handleBackToPerformanceManagers function to reset performance employee statuses
  const handleBackToPerformanceManagers = () => {
    setSelectedPerformanceManager(null)
    setPerformanceEmployeeStatuses([])
  }

  const handleToggleMeetingStatus = async (employeeName: string, managerName: string) => {
    try {
      const currentDate = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

      // Find the employee to get their designation
      const employee = selectedManager?.employees.find((emp) => emp.name === employeeName)
      const designation = employee?.designation || ""

      const requestData = {
        manager_name: managerName,
        employee_name: employeeName,
        designation: designation,
        date: currentDate,
        month: selectedMonth,
        year: selectedYear,
      }

      console.log("🔄 Marking meeting as completed:", requestData)
      console.log("📡 POST Request URL:", `${API_BASE_URL}/api/one_on_one_meetings`)

      const response = await fetch(`${API_BASE_URL}/api/one_on_one_meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log("📥 Update response status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("✅ Meeting marked as completed:", responseData)

        // Refresh employee status to get updated data
        await fetchEmployeeStatus(managerName, selectedMonth, selectedYear)

        toast({
          title: "Success",
          description: "Meeting marked as completed!",
          duration: 3000,
        })
      } else {
        let errorMessage = "Unknown error"
        try {
          const errorData = await response.json()
          console.error("❌ Failed to update meeting status:", errorData)
          errorMessage = errorData.error || "Unknown error"
        } catch (parseError) {
          console.error("❌ Could not parse error response:", parseError)
        }

        toast({
          title: "Error",
          description: `Failed to update meeting: ${errorMessage}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Error updating meeting status:", error)
      toast({
        title: "Error",
        description: "Failed to update meeting status. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  // Update the handleTogglePerformanceMeetingStatus function to refresh performance employee status
  const handleTogglePerformanceMeetingStatus = async (employeeName: string, managerName: string) => {
    try {
      const currentDate = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

      // Find the employee to get their designation
      const employee = selectedPerformanceManager?.employees.find((emp) => emp.name === employeeName)
      const designation = employee?.designation || ""

      const requestData = {
        manager_name: managerName,
        employee_name: employeeName,
        designation: designation,
        date: currentDate,
        month: selectedPerformanceMonth,
        year: selectedPerformanceYear,
      }

      console.log("🔄 Marking performance meeting as completed:", requestData)
      console.log("📡 POST Request URL:", `${API_BASE_URL}/api/performance_meetings`)

      const response = await fetch(`${API_BASE_URL}/api/performance_meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log("📥 Performance update response status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("✅ Performance meeting marked as completed:", responseData)

        // Refresh performance employee status to get updated data
        await fetchPerformanceEmployeeStatus(managerName, selectedPerformanceMonth, selectedPerformanceYear)

        toast({
          title: "Success",
          description: "Performance meeting marked as completed!",
          duration: 3000,
        })
      } else {
        let errorMessage = "Unknown error"
        try {
          const errorData = await response.json()
          console.error("❌ Failed to update performance meeting status:", errorData)
          errorMessage = errorData.error || "Unknown error"
        } catch (parseError) {
          console.error("❌ Could not parse error response:", parseError)
        }

        toast({
          title: "Error",
          description: `Failed to update performance meeting: ${errorMessage}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Error updating performance meeting status:", error)
      toast({
        title: "Error",
        description: "Failed to update performance meeting status. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const getMeetingForEmployeeInSelectedPeriod = (employeeName: string, managerName: string) => {
    return oneOnOneMeetings.find((m) => {
      const meetingMonth = m.month || selectedMonth
      const meetingYear = m.year || selectedYear
      return (
        m.name === employeeName &&
        m.manager === managerName &&
        meetingMonth === selectedMonth &&
        meetingYear === selectedYear
      )
    })
  }

  const getPerformanceMeetingForEmployeeInSelectedPeriod = (employeeName: string, managerName: string) => {
    return performanceMeetings.find(
      (m) =>
        m.name === employeeName &&
        m.manager === managerName &&
        m.month === selectedPerformanceMonth &&
        m.year === selectedPerformanceYear,
    )
  }

  // Update the getPerformanceManagerCompletionStats function to use the performance employee status data
  const getPerformanceManagerCompletionStats = (managerName: string) => {
    // If we have performance employee statuses from the API, use those
    if (selectedPerformanceManager?.name === managerName && performanceEmployeeStatuses.length > 0) {
      const completedCount = performanceEmployeeStatuses.filter((emp) => emp.status === "completed").length
      const totalCount = performanceEmployeeStatuses.length

      return {
        total: totalCount,
        completed: completedCount,
        percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      }
    }

    // Otherwise, use the performance meetings data
    const managerMeetings = performanceMeetings.filter(
      (m) => m.manager === managerName && m.month === selectedPerformanceMonth && m.year === selectedPerformanceYear,
    )

    const manager = performanceManagers.find((m) => m.name === managerName)
    const totalEmployees = manager?.employees.length || 0
    const completedMeetings = managerMeetings.filter((m) => m.isCompleted).length

    return {
      total: totalEmployees,
      completed: completedMeetings,
      percentage: totalEmployees > 0 ? Math.round((completedMeetings / totalEmployees) * 100) : 0,
    }
  }

  // Add this function to calculate completion percentage for a manager
  const calculateCompletionPercentage = (managerName: string, isPerformance = false) => {
    const statusMap = isPerformance ? allPerformanceManagersStatus : allManagersStatus
    const managerEmployees = isPerformance
      ? performanceManagers.find((m) => m.name === managerName)?.employees || []
      : managers.find((m) => m.name === managerName)?.employees || []

    const employeeStatuses = statusMap.get(managerName) || []

    if (employeeStatuses.length > 0) {
      const completedCount = employeeStatuses.filter((emp) => emp.status === "completed").length
      const totalCount = employeeStatuses.length
      return {
        completed: completedCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      }
    }

    return {
      completed: 0,
      total: managerEmployees.length,
      percentage: 0,
    }
  }

  const getManagerCompletionStats = (managerName: string) => {
    // Use employee statuses from the API instead of local state
    const completedCount = employeeStatuses.filter((emp) => emp.status === "completed").length
    const totalCount = employeeStatuses.length

    return {
      total: totalCount,
      completed: completedCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    }
  }

  // Replace the renderPerformanceCalendarView function with this updated version
  const renderPerformanceCalendarView = (manager: Manager) => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToPerformanceManagers} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h2 className="text-xl font-semibold">{manager.name}'s Team</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={selectedPerformanceMonth} onValueChange={setSelectedPerformanceMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {evenMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPerformanceYear} onValueChange={setSelectedPerformanceYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span>
                  Performance Meetings: {selectedPerformanceMonth} {selectedPerformanceYear}
                </span>
              </div>
              <div className="text-sm font-normal text-gray-500">
                {getPerformanceManagerCompletionStats(manager.name).completed}/
                {performanceEmployeeStatuses.length || manager.employees.length} completed
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPerformanceEmployeeStatus ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading performance employee status...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceEmployeeStatuses.length > 0
                    ? performanceEmployeeStatuses.map((employeeStatus) => {
                        const isCompleted = employeeStatus.status === "completed"

                        return (
                          <TableRow key={employeeStatus.name}>
                            <TableCell className="font-medium">{employeeStatus.name}</TableCell>
                            <TableCell>{employeeStatus.designation}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isCompleted ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"
                                }`}
                              >
                                {isCompleted ? "Completed" : "Pending"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${
                                  isCompleted
                                    ? "text-green-600 hover:text-green-800 bg-green-50 cursor-not-allowed"
                                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                }`}
                                onClick={() =>
                                  !isCompleted &&
                                  handleTogglePerformanceMeetingStatus(employeeStatus.name, manager.name)
                                }
                                disabled={isCompleted}
                                title={isCompleted ? "Already Completed" : "Mark as Completed"}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    : manager.employees.map((employee) => {
                        const meeting = getPerformanceMeetingForEmployeeInSelectedPeriod(employee.name, manager.name)
                        const isCompleted = meeting?.isCompleted || employee.isCompleted || false

                        return (
                          <TableRow key={employee.name}>
                            <TableCell className="font-medium">{employee.name}</TableCell>
                            <TableCell>{employee.designation}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isCompleted ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"
                                }`}
                              >
                                {isCompleted ? "Completed" : "Pending"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${
                                  isCompleted
                                    ? "text-green-600 hover:text-green-800 bg-green-50 cursor-not-allowed"
                                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                }`}
                                onClick={() =>
                                  !isCompleted && handleTogglePerformanceMeetingStatus(employee.name, manager.name)
                                }
                                disabled={isCompleted}
                                title={isCompleted ? "Already Completed" : "Mark as Completed"}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  {performanceEmployeeStatuses.length === 0 && manager.employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No employees found for this manager
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show a loading state during SSR or initial client-side rendering
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  // Add this function to calculate completion percentage for a manager

  // Replace the renderManagersList function with this updated version
  const renderManagersList = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {managers.map((manager) => {
          const stats = calculateCompletionPercentage(manager.name)

          return (
            <Card
              key={manager.name}
              className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              onClick={() => handleManagerClick(manager)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{manager.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Completion</span>
                    <span className="text-sm font-medium text-gray-700">{stats.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500 ease-in-out"
                      style={{
                        width: `${stats.percentage}%`,
                        backgroundColor:
                          stats.percentage < 30 ? "#f87171" : stats.percentage < 70 ? "#facc15" : "#4ade80",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {stats.completed}/{stats.total} Completed
                </div>
                <div className="text-xs text-gray-400">{manager.employees.length} Employees</div>
              </CardContent>
            </Card>
          )
        })}
        {managers.length === 0 && (
          <div className="text-center py-4 text-gray-500 col-span-full">No managers found.</div>
        )}
      </div>
    )
  }

  // Replace the renderPerformanceManagersList function with this updated version that includes a progress bar
  const renderPerformanceManagersList = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceManagers.map((manager) => {
          const stats = calculateCompletionPercentage(manager.name, true)

          return (
            <Card
              key={manager.name}
              className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              onClick={() => handlePerformanceManagerClick(manager)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>{manager.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Completion</span>
                    <span className="text-sm font-medium text-gray-700">{stats.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500 ease-in-out"
                      style={{
                        width: `${stats.percentage}%`,
                        backgroundColor:
                          stats.percentage < 30 ? "#f87171" : stats.percentage < 70 ? "#facc15" : "#4ade80",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {stats.completed}/{stats.total} Completed
                </div>
                <div className="text-xs text-gray-400">{manager.employees.length} Employees</div>
              </CardContent>
            </Card>
          )
        })}
        {performanceManagers.length === 0 && (
          <div className="text-center py-4 text-gray-500 col-span-full">
            {performanceMeetingsError ? (
              <div>
                <p>Error loading performance managers:</p>
                <p className="font-bold">{performanceMeetingsError}</p>
              </div>
            ) : (
              "No performance managers found."
            )}
          </div>
        )}
      </div>
    )
  }

  const renderCalendarView = (manager: Manager) => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedManager(null)} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h2 className="text-xl font-semibold">{manager.name}'s Team</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>
                  One on One Meetings: {selectedMonth} {selectedYear}
                </span>
              </div>
              <div className="text-sm font-normal text-gray-500">
                {getManagerCompletionStats(manager.name).completed}/
                {employeeStatuses.length || manager.employees.length} completed
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEmployeeStatus ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading employee status...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeStatuses.length > 0
                    ? employeeStatuses.map((employeeStatus) => {
                        const isCompleted = employeeStatus.status === "completed"

                        return (
                          <TableRow key={employeeStatus.name}>
                            <TableCell className="font-medium">{employeeStatus.name}</TableCell>
                            <TableCell>{employeeStatus.designation}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isCompleted ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"
                                }`}
                              >
                                {isCompleted ? "Completed" : "Pending"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${
                                  isCompleted
                                    ? "text-green-600 hover:text-green-800 bg-green-50 cursor-not-allowed"
                                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                }`}
                                onClick={() =>
                                  !isCompleted && handleToggleMeetingStatus(employeeStatus.name, manager.name)
                                }
                                disabled={isCompleted}
                                title={isCompleted ? "Already Completed" : "Mark as Completed"}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    : manager.employees.map((employee) => {
                        const meeting = getMeetingForEmployeeInSelectedPeriod(employee.name, manager.name)
                        const isCompleted = meeting?.isCompleted || employee.isCompleted || false

                        return (
                          <TableRow key={employee.name}>
                            <TableCell className="font-medium">{employee.name}</TableCell>
                            <TableCell>{employee.designation}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isCompleted ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"
                                }`}
                              >
                                {isCompleted ? "Completed" : "Pending"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${
                                  isCompleted
                                    ? "text-green-600 hover:text-green-800 bg-green-50 cursor-not-allowed"
                                    : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                                }`}
                                onClick={() => !isCompleted && handleToggleMeetingStatus(employee.name, manager.name)}
                                disabled={isCompleted}
                                title={isCompleted ? "Already Completed" : "Mark as Completed"}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  {employeeStatuses.length === 0 && manager.employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No employees found for this manager
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show a loading state during SSR or initial client-side rendering
  if (!isClient || loading) {
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Meeting Management
          </h1>

          <Tabs defaultValue="one-on-one" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one-on-one" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                One on One
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Performance Meeting
              </TabsTrigger>
            </TabsList>

            {/* One on One Tab */}
            {/* Replace the One on One TabsContent with this updated version */}
            <TabsContent value="one-on-one" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  {loadingMeetings ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading meetings...</p>
                    </div>
                  ) : selectedManager ? (
                    renderCalendarView(selectedManager)
                  ) : loadingAllManagersStatus ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Calculating completion status...</p>
                    </div>
                  ) : (
                    renderManagersList()
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Meeting Tab */}
            {/* Replace the Performance Meeting TabsContent with this updated version */}
            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  {loadingPerformanceMeetings ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading performance meetings...</p>
                    </div>
                  ) : selectedPerformanceManager ? (
                    renderPerformanceCalendarView(selectedPerformanceManager)
                  ) : loadingAllPerformanceManagersStatus ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Calculating completion status...</p>
                    </div>
                  ) : (
                    renderPerformanceManagersList()
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
