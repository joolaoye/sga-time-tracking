"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { AuthService } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (accessCode: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      // Auth check failed - user will remain null
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (accessCode: string) => {
    // Clear any existing user state first
    setUser(null)
    
    const user = await AuthService.login(accessCode)
    setUser(user)
  }

  const logout = async () => {
    try {
      await AuthService.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Always clear user state and redirect
      setUser(null)
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear localStorage if you're using it
        localStorage.clear()
        // Clear sessionStorage
        sessionStorage.clear()
      }
      
      // Force redirect to login
      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
