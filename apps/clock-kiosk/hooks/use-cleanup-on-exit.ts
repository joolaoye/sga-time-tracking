"use client"

import { useEffect, useRef } from "react"

interface CleanupOptions {
  onCleanup?: () => void
  enableVisibilityChange?: boolean
  enablePageHide?: boolean
  enableBeforeUnload?: boolean
  enableUnmount?: boolean
  logoutEndpoint?: string
  debugMode?: boolean
}

/**
 * Hook for comprehensive cleanup on page exit for kiosk/shared device scenarios
 * Handles multiple exit scenarios to ensure secure cleanup of session data
 */
export function useCleanupOnExit({
  onCleanup,
  enableVisibilityChange = true,
  enablePageHide = true,
  enableBeforeUnload = true,
  enableUnmount = true,
  logoutEndpoint = "/api/logout/",
  debugMode = false
}: CleanupOptions = {}) {
  const hasCleanedUp = useRef(false)
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const performCleanup = (source: string) => {
      // Prevent duplicate cleanup
      if (hasCleanedUp.current) {
        if (debugMode) console.log(`[Cleanup] Already cleaned up, skipping (source: ${source})`)
        return
      }

      hasCleanedUp.current = true
      if (debugMode) console.log(`[Cleanup] Performing cleanup (source: ${source})`)

      try {
        // 1. Clear all browser storage
        try {
          localStorage.clear()
          sessionStorage.clear()
          if (debugMode) console.log("[Cleanup] Storage cleared")
        } catch (e) {
          if (debugMode) console.error("[Cleanup] Failed to clear storage:", e)
        }

        // 2. Clear IndexedDB if it exists
        if ('indexedDB' in window && window.indexedDB) {
          try {
            indexedDB.databases().then(databases => {
              databases.forEach(db => {
                if (db.name) indexedDB.deleteDatabase(db.name)
              })
            })
          } catch (e) {
            if (debugMode) console.error("[Cleanup] Failed to clear IndexedDB:", e)
          }
        }

        // 3. Clear cookies accessible to JavaScript (non-HttpOnly)
        try {
          document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=")
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
            // Clear cookie for current path and domain
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
          })
          if (debugMode) console.log("[Cleanup] Cookies cleared")
        } catch (e) {
          if (debugMode) console.error("[Cleanup] Failed to clear cookies:", e)
        }

        // 4. Attempt to send logout beacon
        if (logoutEndpoint && navigator.sendBeacon) {
          try {
            const success = navigator.sendBeacon(
              logoutEndpoint.startsWith('http') ? logoutEndpoint : `${window.location.origin}${logoutEndpoint}`,
              JSON.stringify({ 
                source,
                timestamp: new Date().toISOString(),
                app_type: 'clock'
              })
            )
            if (debugMode) console.log(`[Cleanup] Logout beacon sent: ${success}`)
          } catch (e) {
            if (debugMode) console.error("[Cleanup] Failed to send beacon:", e)
          }
        }

        // 5. Call custom cleanup callback
        if (onCleanup) {
          try {
            onCleanup()
            if (debugMode) console.log("[Cleanup] Custom cleanup executed")
          } catch (e) {
            if (debugMode) console.error("[Cleanup] Custom cleanup failed:", e)
          }
        }

        // 6. Clear any pending timers
        if (cleanupTimeoutRef.current) {
          clearTimeout(cleanupTimeoutRef.current)
          cleanupTimeoutRef.current = null
        }

      } catch (error) {
        if (debugMode) console.error("[Cleanup] Unexpected error:", error)
      }
    }

  useEffect(() => {
    // Handler for visibility change (tab switching, minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (debugMode) console.log("[Cleanup] Page hidden, scheduling cleanup...")
        // Delay cleanup slightly to avoid false positives from quick tab switches
        cleanupTimeoutRef.current = setTimeout(() => {
          performCleanup("visibilitychange")
        }, 500)
      } else {
        // Page became visible again, cancel pending cleanup
        if (cleanupTimeoutRef.current) {
          if (debugMode) console.log("[Cleanup] Page visible again, canceling cleanup")
          clearTimeout(cleanupTimeoutRef.current)
          cleanupTimeoutRef.current = null
          hasCleanedUp.current = false
        }
      }
    }

    // Handler for page hide (mobile browsers, back/forward cache)
    const handlePageHide = (e: PageTransitionEvent) => {
      if (debugMode) console.log(`[Cleanup] Page hide event, persisted: ${e.persisted}`)
      if (!e.persisted) {
        // Page is being unloaded, not just cached
        performCleanup("pagehide")
      }
    }

    // Handler for beforeunload (tab close, navigation)
    const handleBeforeUnload = () => {
      performCleanup("beforeunload")
    }

    // Handler for online/offline state changes
    const handleOffline = () => {
      if (debugMode) console.log("[Cleanup] Device went offline")
      // Optionally perform cleanup when device goes offline
      // This is useful for kiosks that might lose connectivity
      performCleanup("offline")
    }

    // Add event listeners based on options
    if (enableVisibilityChange) {
      document.addEventListener("visibilitychange", handleVisibilityChange)
    }

    if (enablePageHide) {
      window.addEventListener("pagehide", handlePageHide)
    }

    if (enableBeforeUnload) {
      window.addEventListener("beforeunload", handleBeforeUnload)
    }

    // Monitor network status for kiosk scenarios
    window.addEventListener("offline", handleOffline)

    // Cleanup function for component unmount
    return () => {
      // Clear any pending cleanup timeout
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
      }

      // Remove all event listeners
      if (enableVisibilityChange) {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
      if (enablePageHide) {
        window.removeEventListener("pagehide", handlePageHide)
      }
      if (enableBeforeUnload) {
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
      window.removeEventListener("offline", handleOffline)

      // Perform cleanup on unmount if enabled
      if (enableUnmount && !hasCleanedUp.current) {
        performCleanup("unmount")
      }
    }
  }, [
    onCleanup,
    enableVisibilityChange,
    enablePageHide,
    enableBeforeUnload,
    enableUnmount,
    logoutEndpoint,
    debugMode
  ])

  // Return a manual cleanup function that can be called imperatively
  return () => {
    performCleanup("manual")
  }
}

// Additional utility to detect if running in kiosk mode
export function isKioskMode(): boolean {
  // Check various indicators of kiosk mode
  return (
    // Check if in fullscreen
    document.fullscreenElement !== null ||
    // Check if window has no toolbar (common in kiosk)
    window.toolbar.visible === false ||
    // Check for kiosk user agent strings
    /kiosk/i.test(navigator.userAgent) ||
    // Check if running on port 3001 (Clock app)
    window.location.port === "3001"
  )
}

// Session timeout manager for strict 2-minute enforcement
export function useSessionTimeout(
  timeoutMs: number = 120000, // 2 minutes default
  onTimeout: () => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  useEffect(() => {
    const resetTimeout = () => {
      lastActivityRef.current = Date.now()
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        onTimeout()
      }, timeoutMs)
    }

    // Monitor user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    
    const handleActivity = () => {
      const now = Date.now()
      // Throttle activity updates to once per second
      if (now - lastActivityRef.current > 1000) {
        resetTimeout()
      }
    }

    // Start the timeout
    resetTimeout()

    // Add activity listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [timeoutMs, onTimeout])

  return {
    lastActivity: lastActivityRef.current,
    resetTimeout: () => {
      lastActivityRef.current = Date.now()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          onTimeout()
        }, timeoutMs)
      }
    }
  }
}
