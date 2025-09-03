"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/api"
import { api } from "@/lib/api"
import { useCleanupOnExit, useSessionTimeout } from "@/hooks/use-cleanup-on-exit"
import { ActivityLog } from "@/components/activity-log"
import { PunchClock } from "@/components/punch-clock"
import { NavBar } from "@/components/nav-bar"
import { IpBlock } from "@/components/ip-block"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Clock } from "lucide-react"

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Login form state
  const [accessCode, setAccessCode] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Comprehensive cleanup on exit for kiosk security
  useCleanupOnExit({
    onCleanup: () => {
      // Additional cleanup: clear user state
      setUser(null)
      setAccessCode("")
    },
    enableVisibilityChange: true,  // Clean up when tab is hidden
    enablePageHide: true,          // Clean up on mobile browser hide
    enableBeforeUnload: true,      // Clean up on page close
    enableUnmount: true,           // Clean up on component unmount
    logoutEndpoint: "/api/logout/",
    debugMode: process.env.NODE_ENV === "development"
  })

  // Enforce strict 2-minute session timeout for kiosk mode
  useSessionTimeout(
    120000, // 2 minutes
    async () => {
      // Session timeout - force logout
      console.log("Session timeout - forcing logout")
      try {
        await api.logout()
      } catch {
        // Ignore errors
      }
      setUser(null)
      setAccessCode("")
      setLoginError("Session expired for security. Please log in again.")
    }
  )

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.verifySession()
        if (user) {
          setUser(user)
        }
      } catch {
        // Session verification failed - user will remain null
      } finally {
        setIsLoading(false)
      }
    }
    
    void checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")

    try {
      const loggedInUser = await api.login(accessCode)
      setUser(loggedInUser)
      // Don't store user in localStorage for shared computer security
    } catch {
      setLoginError("Invalid access code")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {
      // Logout error - user will still be logged out locally
    }
    setUser(null)
    setAccessCode("") // Clear access code for security on shared kiosk
  }

  const handleClockAction = () => {
    // Trigger activity log refresh
    setRefreshTrigger(prev => prev + 1)
  }

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <IpBlock>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Clock className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to TimeTracker</CardTitle>
              <CardDescription>Sign in with your access code</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Access Code</Label>
                  <Input
                    id="accessCode"
                    type="password"
                    value={accessCode}
                    autoComplete="off"
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter your access code"
                    required
                    autoFocus
                  />
                </div>
                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </IpBlock>
    )
  }

  // Show clock dashboard if logged in
  return (
    <IpBlock>
      <div className="flex min-h-screen flex-col">
        <NavBar user={user} onLogout={handleLogout} />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <PunchClock onClockAction={handleClockAction} />
          <ActivityLog key={refreshTrigger} />
        </div>
      </div>
    </IpBlock>
  )
}
