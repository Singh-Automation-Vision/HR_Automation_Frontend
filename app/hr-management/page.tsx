"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Save, X, Search, Package, Users } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import Header from "@/components/header"
import { useToast } from "@/hooks/use-toast"

interface User {
  id?: string | number
  name?: string
  email?: string
  role?: string
  [key: string]: any
}

interface EmployeeInventory {
  name: string
  inventory_details: { [key: string]: number }
}

interface Asset {
  name: string
  quantity: number
}

export default function HRManagementPage() {
  console.log("🚀 HR Management page loaded")

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Add Inventory states
  const [newItem, setNewItem] = useState("")
  const [newQuantity, setNewQuantity] = useState("")
  const [addingInventory, setAddingInventory] = useState(false)

  // Employee Inventory Detail states
  const [employeeInventories, setEmployeeInventories] = useState<EmployeeInventory[]>([])
  const [loadingInventories, setLoadingInventories] = useState(false)
  const [searchEmployee, setSearchEmployee] = useState("")
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<string | null>(null)
  const [selectedEmployeeAssets, setSelectedEmployeeAssets] = useState<Asset[]>([])

  // Inventory Detail states (all inventory items across all employees)
  const [allInventoryItems, setAllInventoryItems] = useState<{ employee: string; asset: string; quantity: number }[]>(
    [],
  )
  const [loadingAllInventory, setLoadingAllInventory] = useState(false)
  const [searchInventory, setSearchInventory] = useState("")

  // Edit states
  const [editingAsset, setEditingAsset] = useState<string | null>(null)
  const [editItem, setEditItem] = useState("")
  const [editQuantity, setEditQuantity] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    console.log("🔄 useEffect triggered - checking user data...")

    const userData = localStorage.getItem("user")
    console.log("💾 Raw userData from localStorage:", userData)

    if (!userData) {
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      console.log("👤 User object in HR management:", parsedUser)

      // Check if user is admin - be more flexible with the check
      const isUserAdmin =
        parsedUser &&
        (parsedUser.username === "admin" ||
          parsedUser.email === "admin" ||
          parsedUser.Username === "admin" ||
          parsedUser.name === "admin" ||
          String(parsedUser.username).toLowerCase() === "admin" ||
          String(parsedUser.email).toLowerCase() === "admin")

      console.log("🔍 HR Management - User admin check:", isUserAdmin)
      console.log("🔍 HR Management - User object:", parsedUser)

      if (!isUserAdmin) {
        console.log("❌ Non-admin user trying to access HR management")
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

  useEffect(() => {
    if (user) {
      console.log("👤 Admin user data is available, fetching data...")
      fetchAllInventories()
      fetchAllInventoryItems()
    }
  }, [user])

  const fetchAllInventories = async () => {
    setLoadingInventories(true)
    console.log("🔄 Starting to fetch all employee inventories...")
    console.log("📡 GET Request URL:", `${API_BASE_URL}/api/inventory_management`)

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory_management`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📥 Response received!")
      console.log("📊 Response Status:", response.status)
      console.log("📊 Response Status Text:", response.statusText)
      console.log("📊 Response OK:", response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log("📥 Raw Response Data:", data)

        const inventories: EmployeeInventory[] = []

        // Handle different response formats
        if (Array.isArray(data)) {
          console.log("📋 Data is an array with", data.length, "items")
          data.forEach((item, index) => {
            console.log(`📋 Processing item ${index + 1}:`, item)
            if (item.inventory && item.inventory.name && item.inventory.inventory_details) {
              inventories.push({
                name: item.inventory.name,
                inventory_details: item.inventory.inventory_details,
              })
              console.log(`✅ Added inventory for: ${item.inventory.name}`)
            } else {
              console.log(`⚠️ Item ${index + 1} missing required fields:`, {
                hasInventory: !!item.inventory,
                hasName: !!(item.inventory && item.inventory.name),
                hasDetails: !!(item.inventory && item.inventory.inventory_details),
              })
            }
          })
        } else if (data && typeof data === "object") {
          console.log("📋 Data is an object:", data)

          // Check if it's a single inventory item
          if (data.inventory && data.inventory.name && data.inventory.inventory_details) {
            inventories.push({
              name: data.inventory.name,
              inventory_details: data.inventory.inventory_details,
            })
            console.log(`✅ Added single inventory for: ${data.inventory.name}`)
          }
          // Check if it's a success response with inventory data
          else if (data.success && data.inventory && data.inventory.name && data.inventory.inventory_details) {
            inventories.push({
              name: data.inventory.name,
              inventory_details: data.inventory.inventory_details,
            })
            console.log(`✅ Added inventory from success response for: ${data.inventory.name}`)
          }
          // Check if data has a direct list of inventories
          else if (data.inventories && Array.isArray(data.inventories)) {
            console.log("📋 Found inventories array in data")
            data.inventories.forEach((item: any, index: number) => {
              if (item.inventory && item.inventory.name && item.inventory.inventory_details) {
                inventories.push({
                  name: item.inventory.name,
                  inventory_details: item.inventory.inventory_details,
                })
                console.log(`✅ Added inventory for: ${item.inventory.name}`)
              }
            })
          } else {
            console.log("⚠️ Data structure not recognized:", {
              hasInventory: !!data.inventory,
              hasSuccess: !!data.success,
              hasInventories: !!data.inventories,
              dataKeys: Object.keys(data),
            })
          }
        } else {
          console.log("⚠️ Unexpected data format:", typeof data, data)
        }

        console.log("🔄 Final processed inventories:", inventories)
        console.log("📊 Total inventories found:", inventories.length)
        setEmployeeInventories(inventories)
      } else {
        console.error("❌ Response not OK!")
        console.error("❌ Status:", response.status)
        console.error("❌ Status Text:", response.statusText)

        try {
          const errorText = await response.text()
          console.error("❌ Error Response Body:", errorText)
        } catch (parseError) {
          console.error("❌ Could not parse error response:", parseError)
        }

        // Set empty array on error but don't throw
        setEmployeeInventories([])

        // Show user-friendly error message
        toast({
          title: "Warning",
          description: "Could not load employee inventories. Please try again later.",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Fetch request failed completely!")
      console.error("❌ Error message:", error instanceof Error ? error.message : String(error))
      console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")

      // Check for specific error types
      if (error instanceof TypeError) {
        console.error("🌐 Network error detected - possible CORS or connectivity issue")
      }

      // Set empty array on error
      setEmployeeInventories([])

      // Show user-friendly error message
      toast({
        title: "Error",
        description: "Failed to connect to the server. Please check your connection and try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      console.log("🏁 Fetch inventories operation completed")
      console.log("⏰ Completion timestamp:", new Date().toISOString())
      setLoadingInventories(false)
    }
  }

  const fetchAllInventoryItems = async () => {
    setLoadingAllInventory(true)
    console.log("🔄 Starting to fetch all inventory items...")
    console.log("📡 GET Request URL:", `${API_BASE_URL}/api/inventory_available`)

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory_available`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📥 All inventory items response received!")
      console.log("📊 Response Status:", response.status)
      console.log("📊 Response OK:", response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log("📥 All inventory items raw data:", data)
        const allItems: { employee: string; asset: string; quantity: number }[] = []

        // Handle the new format where data.inventory is an object like {"Laptop": 1, "Mouse": 5}
        if (data.success && data.inventory && typeof data.inventory === "object") {
          console.log("📋 Processing inventory items from new object format")
          console.log("📦 Inventory object:", data.inventory)

          // Transform object entries to array format
          Object.entries(data.inventory).forEach(([assetName, quantity]) => {
            console.log(`➕ Processing asset: ${assetName} with quantity: ${quantity}`)
            allItems.push({
              employee: "Available", // Since there's no employee for available inventory
              asset: assetName,
              quantity: Number(quantity),
            })
          })
        } else {
          console.log("⚠️ Unexpected data structure from inventory_available endpoint:", data)
          console.log("📋 Has success field:", !!data.success)
          console.log("📋 Has inventory field:", !!data.inventory)
          console.log("📋 Inventory type:", typeof data.inventory)
        }

        console.log("🔄 Final all inventory items:", allItems)
        console.log("📊 Total items found:", allItems.length)
        setAllInventoryItems(allItems)
      } else {
        console.error("❌ Failed to fetch all inventory items")
        console.error("❌ Status:", response.status)

        try {
          const errorText = await response.text()
          console.error("❌ Error Response:", errorText)
        } catch (parseError) {
          console.error("❌ Could not parse error response:", parseError)
        }

        setAllInventoryItems([])
      }
    } catch (error) {
      console.error("❌ Error fetching all inventory items:", error)
      setAllInventoryItems([])
    } finally {
      setLoadingAllInventory(false)
    }
  }

  const fetchEmployeeInventory = async (employeeName: string) => {
    console.log("🔄 Fetching inventory for employee:", employeeName)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/inventory_management?name=${encodeURIComponent(employeeName)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        console.log("📥 Employee inventory data:", data)

        const assets: Asset[] = []

        if (data.success && data.inventory && data.inventory.inventory_details) {
          Object.entries(data.inventory.inventory_details).forEach(([assetName, quantity]) => {
            assets.push({
              name: assetName,
              quantity: Number(quantity),
            })
          })
        }

        setSelectedEmployeeAssets(assets)
        setSelectedEmployeeForDetail(employeeName)
      }
    } catch (error) {
      console.error("❌ Error fetching employee inventory:", error)
    }
  }

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem || !newQuantity) return

    setAddingInventory(true)

    const addData = {
      action: "add",
      name: "General Inventory",
      item: newItem,
      quantity: Number.parseInt(newQuantity),
    }

    console.log("➕ Adding general inventory item:", addData)

    try {
      console.log("📡 POST Request URL:", `${API_BASE_URL}/api/inventory_management`)
      const response = await fetch(`${API_BASE_URL}/api/inventory_management`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addData),
      })

      if (response.ok) {
        setNewItem("")
        setNewQuantity("")
        fetchAllInventories()
        fetchAllInventoryItems()
        toast({
          title: "Success",
          description: "Inventory item added successfully!",
          duration: 3000,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: `Failed to add inventory: ${errorData.error || "Unknown error"}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Error adding inventory:", error)
      toast({
        title: "Error",
        description: "Failed to add inventory. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setAddingInventory(false)
    }
  }

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset.name)
    setEditItem(asset.name)
    setEditQuantity(asset.quantity.toString())
  }

  const handleSaveEdit = async (itemName: string) => {
    if (!selectedEmployeeForDetail) return

    const editData = {
      action: "edit",
      name: selectedEmployeeForDetail,
      original_item: itemName,
      item: editItem,
      quantity: Number.parseInt(editQuantity),
    }

    try {
      console.log("📡 PUT Request URL:", `${API_BASE_URL}/api/inventory_management`)
      const response = await fetch(`${API_BASE_URL}/api/inventory_management`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        setEditingAsset(null)
        setEditItem("")
        setEditQuantity("")
        fetchEmployeeInventory(selectedEmployeeForDetail)
        fetchAllInventories()
        fetchAllInventoryItems()
        toast({
          title: "Success",
          description: "Asset updated successfully!",
          duration: 3000,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: `Failed to update asset: ${errorData.error || "Unknown error"}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Error updating asset:", error)
      toast({
        title: "Error",
        description: "Failed to update asset. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingAsset(null)
    setEditItem("")
    setEditQuantity("")
  }

  const handleDeleteAsset = async (itemName: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return
    if (!selectedEmployeeForDetail) return

    const assetToDelete = selectedEmployeeAssets.find((asset) => asset.name === itemName)
    if (!assetToDelete) return

    const deleteData = {
      inventory_details: {
        [itemName]: assetToDelete.quantity,
      },
      name: selectedEmployeeForDetail,
    }

    try {
      console.log("📡 DELETE Request URL:", `${API_BASE_URL}/api/inventory_management`)
      const response = await fetch(`${API_BASE_URL}/api/inventory_management`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteData),
      })

      if (response.ok) {
        fetchEmployeeInventory(selectedEmployeeForDetail)
        fetchAllInventories()
        fetchAllInventoryItems()
        toast({
          title: "Success",
          description: "Asset deleted successfully!",
          duration: 3000,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: `Failed to delete asset: ${errorData.error || "Unknown error"}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Error deleting asset:", error)
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleEditQuantity = async (employeeName: string, assetName: string, newQuantity: number) => {
    const editData = {
      action: "edit",
      asset: assetName,
      quantity: newQuantity,
    }

    try {
      console.log("📡 POST Request URL:", `${API_BASE_URL}/api/inventory_available`)
      const response = await fetch(`${API_BASE_URL}/api/inventory_available`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        fetchAllInventories()
        fetchAllInventoryItems()
        toast({
          title: "Success",
          description: "Quantity updated successfully!",
          duration: 3000,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: `Failed to update quantity: ${errorData.error || "Unknown error"}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Error updating quantity:", error)
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleRemoveItem = async (employeeName: string, assetName: string, quantity: number) => {
    if (!confirm("Are you sure you want to remove this item?")) return

    const deleteData = {
      action: "delete",
      asset: assetName,
      quantity: quantity,
    }

    try {
      console.log("📡 POST Request URL:", `${API_BASE_URL}/api/inventory_available`)
      const response = await fetch(`${API_BASE_URL}/api/inventory_available`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteData),
      })

      if (response.ok) {
        fetchAllInventories()
        fetchAllInventoryItems()
        toast({
          title: "Success",
          description: "Item removed successfully!",
          duration: 3000,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: `Failed to remove item: ${errorData.error || "Unknown error"}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Error removing item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const filteredEmployees = employeeInventories.filter((emp) =>
    emp.name.toLowerCase().includes(searchEmployee.toLowerCase()),
  )

  const filteredInventoryItems = allInventoryItems.filter(
    (item) =>
      item.employee.toLowerCase().includes(searchInventory.toLowerCase()) ||
      item.asset.toLowerCase().includes(searchInventory.toLowerCase()),
  )

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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">HR Management</h1>

          {/* Level 1: HR Management main tabs */}
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory
              </TabsTrigger>
            </TabsList>

            {/* Level 2: When Inventory tab is clicked, show the four sub-tabs */}
            <TabsContent value="inventory" className="mt-6">
              <Tabs defaultValue="add-inventory" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="add-inventory" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Inventory
                  </TabsTrigger>
                  <TabsTrigger value="employee-inventory" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Employee Inventory
                  </TabsTrigger>
                  <TabsTrigger value="inventory-available" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Inventory Available
                  </TabsTrigger>
                  <TabsTrigger value="edit-inventory" className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Inventory
                  </TabsTrigger>
                </TabsList>

                {/* Level 3: Content for each sub-tab */}

                {/* Add Inventory Tab */}
                <TabsContent value="add-inventory" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Add New Inventory Item
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddInventory} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="newItem" className="block text-sm font-medium text-gray-700 mb-2">
                              Item Name
                            </label>
                            <Input
                              id="newItem"
                              type="text"
                              placeholder="Enter item name"
                              value={newItem}
                              onChange={(e) => setNewItem(e.target.value)}
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="newQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity
                            </label>
                            <Input
                              id="newQuantity"
                              type="number"
                              placeholder="Enter quantity"
                              value={newQuantity}
                              onChange={(e) => setNewQuantity(e.target.value)}
                              min="1"
                              required
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-[#00ff00] hover:bg-[#00dd00] text-black"
                          disabled={addingInventory}
                        >
                          {addingInventory ? "Adding..." : "Add Inventory Item"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Employee Inventory Tab */}
                <TabsContent value="employee-inventory" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Employee List</CardTitle>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search employees..."
                            value={searchEmployee}
                            onChange={(e) => setSearchEmployee(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        {loadingInventories ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading employees...</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredEmployees.map((employee) => (
                              <div
                                key={employee.name}
                                className={`p-3 rounded-md border cursor-pointer transition-colors ${
                                  selectedEmployeeForDetail === employee.name
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-white border-gray-200 hover:bg-gray-50"
                                }`}
                                onClick={() => fetchEmployeeInventory(employee.name)}
                              >
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-sm text-gray-500">
                                  {Object.keys(employee.inventory_details).length} items
                                </div>
                              </div>
                            ))}
                            {filteredEmployees.length === 0 && (
                              <div className="text-center py-4 text-gray-500">No employees found</div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {selectedEmployeeForDetail
                            ? `${selectedEmployeeForDetail}'s Inventory`
                            : "Select an Employee"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedEmployeeForDetail ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>S.No</TableHead>
                                <TableHead>Asset</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedEmployeeAssets.map((asset, index) => (
                                <TableRow key={asset.name}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                    {editingAsset === asset.name ? (
                                      <Input
                                        value={editItem}
                                        onChange={(e) => setEditItem(e.target.value)}
                                        className="w-full"
                                      />
                                    ) : (
                                      asset.name
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingAsset === asset.name ? (
                                      <Input
                                        type="number"
                                        value={editQuantity}
                                        onChange={(e) => setEditQuantity(e.target.value)}
                                        className="w-20"
                                        min="1"
                                      />
                                    ) : (
                                      asset.quantity
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      {editingAsset === asset.name ? (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSaveEdit(asset.name)}
                                            className="text-green-600 hover:text-green-800"
                                          >
                                            <Save className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                            className="text-gray-600 hover:text-gray-800"
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditAsset(asset)}
                                            className="text-blue-600 hover:text-blue-800"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteAsset(asset.name)}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {selectedEmployeeAssets.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                    No inventory items found for this employee
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>Select an employee from the list to view their inventory details</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Inventory Available Tab */}
                <TabsContent value="inventory-available" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Available Inventory Items
                      </CardTitle>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search available inventory..."
                          value={searchInventory}
                          onChange={(e) => setSearchInventory(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingAllInventory ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading available inventory...</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>S.No</TableHead>
                              <TableHead>Asset Name</TableHead>
                              <TableHead>Total Quantity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Group items by asset name and show total quantities */}
                            {Object.entries(
                              filteredInventoryItems.reduce(
                                (acc, item) => {
                                  if (!acc[item.asset]) {
                                    acc[item.asset] = { totalQuantity: 0 }
                                  }
                                  acc[item.asset].totalQuantity += item.quantity
                                  return acc
                                },
                                {} as Record<string, { totalQuantity: number }>,
                              ),
                            ).map(([assetName, data], index) => (
                              <TableRow key={assetName}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{assetName}</TableCell>
                                <TableCell>{data.totalQuantity}</TableCell>
                              </TableRow>
                            ))}
                            {filteredInventoryItems.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                                  No inventory items available
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Edit Inventory Tab */}
                <TabsContent value="edit-inventory" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit className="w-5 h-5" />
                        Edit Inventory Items
                      </CardTitle>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search inventory items to edit..."
                          value={searchInventory}
                          onChange={(e) => setSearchInventory(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingAllInventory ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading inventory items...</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>S.No</TableHead>
                              <TableHead>Asset Name</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead className="w-24 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredInventoryItems.map((item, index) => (
                              <TableRow key={`${item.employee}-${item.asset}`}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  {editingAsset === `${item.employee}-${item.asset}` ? (
                                    <Input
                                      value={editItem}
                                      onChange={(e) => setEditItem(e.target.value)}
                                      className="w-full"
                                    />
                                  ) : (
                                    <span className="font-medium">{item.asset}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingAsset === `${item.employee}-${item.asset}` ? (
                                    <Input
                                      type="number"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(e.target.value)}
                                      className="w-20"
                                      min="1"
                                    />
                                  ) : (
                                    item.quantity
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end space-x-2">
                                    {editingAsset === `${item.employee}-${item.asset}` ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleEditQuantity(item.employee, editItem, Number.parseInt(editQuantity))
                                          }
                                          className="h-8 w-8 text-green-600 hover:text-green-800"
                                        >
                                          <Save className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={handleCancelEdit}
                                          className="h-8 w-8 text-gray-600 hover:text-gray-800"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setEditingAsset(`${item.employee}-${item.asset}`)
                                            setEditItem(item.asset)
                                            setEditQuantity(item.quantity.toString())
                                            setSelectedEmployeeForDetail(item.employee)
                                          }}
                                          className="h-8 w-8 text-blue-600 hover:text-blue-800"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleRemoveItem(item.employee, item.asset, item.quantity)}
                                          className="h-8 w-8 text-red-600 hover:text-red-800"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {filteredInventoryItems.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                  No inventory items found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
