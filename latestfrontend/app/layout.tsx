import type { Metadata } from "next"
import { Geist, Geist_Mono, Orbitron } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation"
import { SimulatorProvider } from "@/context/simulator-context"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "700", "900"],
})

export const metadata: Metadata = {
  title: "InSilico — Clinical Trial Companion",
  description:
    "An AI-powered clinical trial simulator and workflow assistant. Forge safer, faster, more personalized trials.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${orbitron.variable} bg-background`}
    >
      <body className="font-sans antialiased min-h-screen bg-transparent text-foreground">
        <SimulatorProvider>
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <SmokeBackground smokeColor="#FF0000" />
          </div>
          {children}
          {process.env.NODE_ENV === "production" && <Analytics />}
        </SimulatorProvider>
      </body>
    </html>
  )
}
