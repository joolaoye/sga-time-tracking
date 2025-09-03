"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Plus, RefreshCw, Copy } from "lucide-react"
import { toast } from "sonner"

interface AccessCode {
  id: string;
  user_name: string;
  access_code: string;
  created_at: string;
}

export default function AdminAccessCodesPage() {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [selectedCode, setSelectedCode] = useState<AccessCode | null>(null)

  useEffect(() => {
    loadAccessCodes()
  }, [])

  const loadAccessCodes = async () => {
    try {
      const data = await api.getAllUsers()
      // Transform user data to access code format
      const codes = Array.isArray(data) ? data : (data as any)?.results || []
      const transformedCodes: AccessCode[] = codes.map((user: any) => ({
        id: user.id,
        user_name: user.full_name,
        access_code: user.access_code || 'N/A',
        created_at: user.created_at || new Date().toISOString()
      }))
      setAccessCodes(transformedCodes)
    } catch (error) {
      console.error("Failed to load access codes:", error)
      toast.error("Failed to load access codes")
      setAccessCodes([])
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateCode = (code: AccessCode) => {
    setSelectedCode(code)
    setShowRegenerateDialog(true)
  }

  const handleConfirmRegenerate = async () => {
    if (!selectedCode) return

    try {
      const response = await api.regenerateAccessCode(selectedCode.id)
      setShowRegenerateDialog(false)
      setSelectedCode(null)
      
      // Refresh the access codes list to show the new code
      await loadAccessCodes()
      
      // Show success with more detailed information
      toast.success(
        `Access code regenerated for ${selectedCode.user_name}! New code: ${response.new_access_code}`,
        {
          duration: 8000, // Show longer so admin can note the new code
        }
      )
    } catch (error) {
      console.error("Failed to regenerate access code:", error)
      toast.error("Failed to regenerate access code")
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Access code copied to clipboard")
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Access Code Management</h1>
            <p className="text-muted-foreground">View and manage user access codes</p>
          </div>
        </div>

        {/* Regenerate Code Dialog */}
        <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regenerate Access Code</DialogTitle>
              <DialogDescription>
                Are you sure you want to regenerate the access code for {selectedCode?.user_name}? The old code will be invalidated.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmRegenerate} variant="destructive">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>User Access Codes</CardTitle>
            <CardDescription>{accessCodes.length} users with access codes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Access Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(accessCodes) && accessCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">{code.user_name}</TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2 group">
                          <span className="font-medium">{code.access_code}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(code.access_code)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRegenerateCode(code)}
                          title="Regenerate access code"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                        </Button>
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
