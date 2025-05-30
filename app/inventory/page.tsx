"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
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

interface Asset {
  name: string // Using name as the unique identifier
  quantity: number
}

export default function InventoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [toolNeeded, setToolNeeded] = useState("")
  const [reason, setReason] = useState("")
  const [agreementChecked, setAgreementChecked] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [newItem, setNewItem] = useState("")
  const [newQuantity, setNewQuantity] = useState("")
  const [assets, setAssets] = useState<Asset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)

    // Log only on client-side
    console.log("🚀 InventoryPage component loaded - Console logging is working!")
    if (typeof window !== "undefined") {
      console.log("🌐 Current URL:", window.location.href)
    }
    console.log("⏰ Component load time:", new Date().toISOString())
  }, [])

  useEffect(() => {
    if (!isClient) return

    console.log("🔄 useEffect triggered - checking user data...")

    // Get user data from localStorage
    const userData = localStorage.getItem("user")
    console.log("💾 Raw userData from localStorage:", userData)

    if (!userData) {
      // No user data found, redirect to login
      router.push("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      console.log("👤 User object in inventory:", parsedUser)
      console.log("📧 Available user properties:", Object.keys(parsedUser))
      setUser(parsedUser)
      // fetchAssets will be called in a separate useEffect after user is set
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("user")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }, [router, isClient])

  // Add a new useEffect to fetch assets when user data is available
  useEffect(() => {
    if (user && isClient) {
      console.log("👤 User data is available, fetching assets...")
      fetchAssets()
    }
  }, [user, isClient])

  const fetchAssets = async () => {
    if (!isClient) return

    setLoadingAssets(true)

    if (!user) {
      console.log("❌ No user data available for fetching assets")
      setLoadingAssets(false)
      return
    }

    const employeeName = user?.Username || user?.username || user?.name || user?.email || "Unknown User"

    console.log("🔄 Starting to fetch assets for employee:", employeeName)
    console.log("📡 GET Request URL:", `${API_BASE_URL}/api/inventory_details?name=${encodeURIComponent(employeeName)}`)
    console.log("⏰ Request timestamp:", new Date().toISOString())

    try {
      console.log("📤 Sending GET request for employee:", employeeName)

      const response = await fetch(`${API_BASE_URL}/api/inventory_details?name=${encodeURIComponent(employeeName)}`, {
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
        console.log("✅ Response is OK, parsing JSON...")

        const data = await response.json()
        console.log("📥 Raw Response Data:", data)

        // Transform the employee-specific data structure to our Asset interface
        const transformedAssets: Asset[] = []

        // Handle the new format where data has success, inventory.name and inventory.inventory_details fields
        if (data.success && data.inventory && data.inventory.name && data.inventory.inventory_details) {
          const inventoryData = data.inventory
          const dataEmployeeName = inventoryData.name
          console.log("🔄 Found employee data for:", dataEmployeeName)
          console.log("👤 Requested employee:", employeeName)
          console.log("🔍 Names match:", dataEmployeeName === employeeName)

          // Check if this is the data for the requested employee
          if (dataEmployeeName === employeeName) {
            console.log("✅ Processing inventory details for matching employee:", dataEmployeeName)
            console.log("📦 Inventory details object:", inventoryData.inventory_details)

            // Extract inventory_details and convert to array format
            // This transforms { "Laptop": 1, "keyboard": 1, "monitor ": 1, "mouse": 2 }
            // into [{ name: "Laptop", quantity: 1 }, { name: "keyboard", quantity: 1 }, etc.]
            Object.entries(inventoryData.inventory_details).forEach(([assetName, quantity], index) => {
              console.log(`➕ Processing asset ${index + 1}: ${assetName} with quantity: ${quantity}`)
              transformedAssets.push({
                name: assetName, // This will be "Laptop", "keyboard", "monitor ", "mouse", etc.
                quantity: Number(quantity),
              })
            })

            console.log("🔄 Successfully extracted inventory_details and converted to array")
            console.log("📋 Transformed assets:", transformedAssets)
          } else {
            console.log("⚠️ Employee name mismatch!")
            console.log("📋 Expected:", employeeName)
            console.log("📋 Received:", dataEmployeeName)
          }
        } else {
          console.log("⚠️ Invalid data structure received")
          console.log("📋 Has success field:", !!data.success)
          console.log("📋 Has inventory field:", !!data.inventory)
          console.log("📋 Has inventory.name field:", !!(data.inventory && data.inventory.name))
          console.log(
            "📋 Has inventory.inventory_details field:",
            !!(data.inventory && data.inventory.inventory_details),
          )
          console.log("📋 Full data structure:", data)
        }

        console.log("🔄 Final extracted assets for", employeeName, ":", transformedAssets)
        console.log("📊 Total assets count:", transformedAssets.length)

        setAssets(transformedAssets)
        console.log("✅ Assets state updated successfully for employee:", employeeName)
      } else {
        console.error("❌ Response not OK!")
        console.error("❌ Status:", response.status)
        console.error("❌ Status Text:", response.statusText)

        try {
          const errorData = await response.text()
          console.error("❌ Error Response Body:", errorData)
        } catch (parseError) {
          console.error("❌ Could not parse error response:", parseError)
        }

        // Set empty assets if API fails for this specific employee
        console.log("⚠️ Setting empty assets due to API failure for employee:", employeeName)
        setAssets([])
      }
    } catch (error) {
      console.error("❌ Fetch request failed completely!")
      console.error("❌ Error message:", error instanceof Error ? error.message : String(error))

      // Check for specific error types
      if (error instanceof TypeError) {
        console.error("🌐 Network error detected - possible CORS or connectivity issue")
      }

      // Set empty assets if API fails for this specific employee
      console.log("⚠️ Setting empty assets due to fetch error for employee:", employeeName)
      setAssets([])
    } finally {
      console.log("🏁 Fetch assets operation completed for employee:", employeeName)
      console.log("⏰ Completion timestamp:", new Date().toISOString())
      setLoadingAssets(false)
    }
  }

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !toolNeeded || !reason || !agreementChecked || !isClient) return

    setSubmittingRequest(true)

    const requestData = {
      name: user?.Username || user?.username || user?.name || user?.email || "Unknown User",
      tool_needed: toolNeeded,
      reason: reason,
    }

    console.log("🚀 Submitting inventory request...")
    console.log("📡 POST Request URL:", `${API_BASE_URL}/api/inventory_request`)
    console.log("📤 POST Request Data:", requestData)

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory_request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log("📥 POST Response Status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("📥 POST Response Data:", responseData)
        setToolNeeded("")
        setReason("")
        setAgreementChecked(false)
        toast({
          title: "Success",
          description: "Inventory request submitted successfully!",
          duration: 3000,
        })
      } else {
        const errorData = await response.json()
        console.log("❌ POST Error Response:", errorData)
        toast({
          title: "Error",
          description: `Failed to submit request: ${errorData.error || "Unknown error"}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Error submitting request:", error)
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSubmittingRequest(false)
    }
  }

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem || !newQuantity || !user || !isClient) return

    const addData = {
      action: "add",
      name: user?.Username || user?.username || user?.name || user?.email || "Unknown User",
      item: newItem,
      quantity: Number.parseInt(newQuantity),
    }

    console.log("➕ Adding new asset...")
    console.log("📡 POST Request URL:", `${API_BASE_URL}/api/inventory_details`)
    console.log("📤 POST Request Data:", addData)

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory_details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addData),
      })

      console.log("📥 POST Response Status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("📥 POST Response Data:", responseData)
        setNewItem("")
        setNewQuantity("")
        fetchAssets() // Refresh the assets list
        toast({
          title: "Success",
          description: "Asset added successfully!",
          duration: 3000,
        })
      } else {
        const errorData = await response.json()
        console.log("❌ POST Error Response:", errorData)
        toast({
          title: "Error",
          description: `Failed to add asset: ${errorData.error || "Unknown error"}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("❌ Error adding asset:", error)
      toast({
        title: "Error",
        description: "Failed to add asset. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleDeleteAsset = async (itemName: string) => {
    if (!isClient) return

    // Use a safer confirm dialog approach for SSR
    let confirmDelete = false
    if (typeof window !== "undefined") {
      confirmDelete = window.confirm("Are you sure you want to delete this asset?")
    }

    if (!confirmDelete || !user) return

    // Find the asset to get the quantity
    const assetToDelete = assets.find((asset) => asset.name === itemName)
    if (!assetToDelete) {
      toast({
        title: "Error",
        description: "Asset not found",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    const deleteData = {
      inventory_details: {
        [itemName]: assetToDelete.quantity,
      },
      name: user?.Username || user?.username || user?.name || user?.email || "Unknown User",
    }

    console.log("🗑️ Deleting asset...")
    console.log("📡 DELETE Request URL:", `${API_BASE_URL}/api/inventory_details`)
    console.log("📤 DELETE Request Data:", deleteData)

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory_details`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteData),
      })

      console.log("📥 DELETE Response Status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("📥 DELETE Response Data:", responseData)
        fetchAssets() // Refresh the assets list
        toast({
          title: "Success",
          description: "Asset deleted successfully!",
          duration: 3000,
        })
      } else {
        const errorData = await response.json()
        console.log("❌ DELETE Error Response:", errorData)
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
          <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>

          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="request">Inventory Request</TabsTrigger>
              <TabsTrigger value="details">Inventory Details</TabsTrigger>
            </TabsList>

            <TabsContent value="request" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Inventory Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={user?.Username || user?.username || user?.name || user?.email || "No name available"}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="toolNeeded" className="block text-sm font-medium text-gray-700 mb-2">
                        Tool Needed
                      </label>
                      <Input
                        id="toolNeeded"
                        type="text"
                        placeholder="Enter the tool you need"
                        value={toolNeeded}
                        onChange={(e) => setToolNeeded(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Request
                      </label>
                      <Textarea
                        id="reason"
                        placeholder="Please explain why you need this tool"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agreement"
                        checked={agreementChecked}
                        onCheckedChange={(checked) => setAgreementChecked(checked as boolean)}
                      />
                      <label htmlFor="agreement" className="text-sm font-bold text-gray-900">
                        I understand that this request is subject to approval by my employer
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#00ff00] hover:bg-[#00dd00] text-black"
                      disabled={!agreementChecked || submittingRequest}
                    >
                      {submittingRequest ? "Submitting..." : "Submit Request"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAssets ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading assets...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>S.No</TableHead>
                          <TableHead>Assets</TableHead>
                          <TableHead>Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assets.map((asset, index) => (
                          <TableRow key={asset.name}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{asset.name}</TableCell>
                            <TableCell>{asset.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add New Asset</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddAsset} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="newItem" className="block text-sm font-medium text-gray-700 mb-2">
                          Item
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

                    <Button type="submit" className="w-full bg-[#00ff00] hover:bg-[#00dd00] text-black">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Asset
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
