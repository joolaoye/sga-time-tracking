"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { IpCheckResponse } from "@/lib/api"
import { AlertTriangle, Shield, Wifi, WifiOff } from "lucide-react"

interface IpBlockProps {
  children: React.ReactNode
}

export function IpBlock({ children }: IpBlockProps) {
  const [ipCheck, setIpCheck] = useState<IpCheckResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkIpAccess = async () => {
      try {
        const result = await api.checkIpAccess()
        setIpCheck(result)
      } catch {
        // If IP check fails, assume access is allowed to prevent blocking
        setIpCheck({ allowed: true })
      } finally {
        setIsLoading(false)
      }
    }

    checkIpAccess()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
          <div className="text-lg">Checking access...</div>
          <p className="text-sm text-muted-foreground mt-2">
            Verifying your device is authorized to access this system
          </p>
        </div>
      </div>
    )
  }

  if (!ipCheck?.allowed) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <WifiOff className="h-16 w-16 text-destructive" />
              <AlertTriangle className="h-8 w-8 text-destructive absolute -top-2 -right-2" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Access Denied
          </h1>
          
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-destructive mb-2">
              Your device is not authorized to access the time tracking system.
            </p>
            {ipCheck?.ip_address && (
              <p className="text-xs text-muted-foreground">
                Your IP address: <code className="bg-muted px-1 rounded">{ipCheck.ip_address}</code>
              </p>
            )}
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Security Notice</p>
                <p>This system is restricted to authorized devices only.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Wifi className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">What to do</p>
                <p>Contact your administrator to add your device to the allowed list.</p>
              </div>
            </div>
          </div>

          {ipCheck?.message && (
            <div className="mt-6 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                {ipCheck.message}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
} 