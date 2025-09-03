import { Geist, Geist_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { AuthenticatedLayout } from "@/components/authenticated-layout"
import { TimeTrackingProvider } from "@/contexts/time-tracking-context"
import { Toaster } from "@workspace/ui/components/sonner"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>
          <AuthenticatedLayout>
            <TimeTrackingProvider>
              {children}
            </TimeTrackingProvider>
          </AuthenticatedLayout>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
