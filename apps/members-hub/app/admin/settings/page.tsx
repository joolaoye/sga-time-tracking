"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Settings, Wifi, Plus, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface AllowedIP {
  id: string;
  ip_address: string;
  label: string;
  created_at: string;
}

export default function AdminSettingsPage() {
  const [allowedIPs, setAllowedIPs] = useState<AllowedIP[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedIP, setSelectedIP] = useState<AllowedIP | null>(null)
  const [newIP, setNewIP] = useState({
    ip_address: "",
    label: ""
  })
  const [editIP, setEditIP] = useState({
    ip_address: "",
    label: ""
  })

  useEffect(() => {
    loadAllowedIPs()
  }, [])

  const loadAllowedIPs = async () => {
    try {
      const data = await api.getAllowedIPs()
      // Handle both array and paginated response
      const ips = Array.isArray(data) ? data : (data as any)?.results || []
      // Sort IP addresses by label first, then by IP address
      const sortedIPs = [...ips].sort((a, b) => {
        // Sort by label first (empty labels come last)
        const labelA = a.label || 'zzz' // Put empty labels at end
        const labelB = b.label || 'zzz'
        const labelCompare = labelA.localeCompare(labelB)
        if (labelCompare !== 0) return labelCompare
        // If labels are the same, sort by IP address
        return a.ip_address.localeCompare(b.ip_address)
      })
      setAllowedIPs(sortedIPs)
    } catch (error) {
      console.error("Failed to load allowed IPs:", error)
      toast.error("Failed to load allowed IPs")
      setAllowedIPs([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleAddIP = async () => {
    try {
      await api.createAllowedIP(newIP)
      setShowAddDialog(false)
      setNewIP({ ip_address: "", label: "" })
      loadAllowedIPs()
      toast.success("IP address added successfully!")
    } catch (error) {
      console.error("Failed to add IP address:", error)
      toast.error("Failed to add IP address")
    }
  }

  const handleEditIP = (ip: AllowedIP) => {
    setSelectedIP(ip)
    setEditIP({ ip_address: ip.ip_address, label: ip.label })
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedIP) return
    
    try {
      await api.updateAllowedIP(selectedIP.id, { label: editIP.label })
      setShowEditDialog(false)
      setSelectedIP(null)
      setEditIP({ ip_address: "", label: "" })
      loadAllowedIPs()
      toast.success("IP address updated successfully!")
    } catch (error) {
      console.error("Failed to update IP address:", error)
      toast.error("Failed to update IP address")
    }
  }

  const handleDeleteIP = (ip: AllowedIP) => {
    setSelectedIP(ip)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedIP) return

    try {
      await api.deleteAllowedIP(selectedIP.id)
      setShowDeleteDialog(false)
      setSelectedIP(null)
      loadAllowedIPs()
      toast.success("IP address deleted successfully")
    } catch (error) {
      console.error("Failed to delete IP address:", error)
      toast.error("Failed to delete IP address")
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure system-wide settings and security options</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add IP Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Allowed IP Address</DialogTitle>
                <DialogDescription>Add a new IP address to the allowed list for clock app access.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ip-address">IP Address</Label>
                  <Input
                    id="ip-address"
                    value={newIP.ip_address}
                    onChange={(e) => setNewIP({ ...newIP, ip_address: e.target.value })}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Label (Optional)</Label>
                  <Input
                    id="label"
                    value={newIP.label}
                    onChange={(e) => setNewIP({ ...newIP, label: e.target.value })}
                    placeholder="Office Computer A"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddIP}>Add IP Address</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit IP Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit IP Address</DialogTitle>
              <DialogDescription>
                Update label for IP address {selectedIP?.ip_address}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ip-address">IP Address</Label>
                <Input
                  id="edit-ip-address"
                  value={selectedIP?.ip_address || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-label">Label (Optional)</Label>
                <Input
                  id="edit-label"
                  value={editIP.label}
                  onChange={(e) => setEditIP({ ...editIP, label: e.target.value })}
                  placeholder="Office Computer A"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete IP Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete IP Address</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedIP?.label || selectedIP?.ip_address}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete IP Address
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Allowed IP Addresses
            </CardTitle>
            <CardDescription>Manage IP addresses allowed to access the clock app</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(allowedIPs) && allowedIPs.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono font-medium">{ip.ip_address}</TableCell>
                      <TableCell>
                        {ip.label ? (
                          <span>{ip.label}</span>
                        ) : (
                          <span className="text-muted-foreground">No label</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditIP(ip)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteIP(ip)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
