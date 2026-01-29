import type { Metadata } from "next"
import Script from "next/script"
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google"
import "@/styles/globals.css"
import "@/styles/landing.css"
import "@/styles/onboarding.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic", "normal"],
  variable: "--font-playfair",
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Floo | L'Assistant WhatsApp Intelligent",
  description: "L'assistant IA qui automatise vos tâches quotidiennes via WhatsApp",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} bg-[#050505] text-neutral-200 antialiased overflow-x-hidden selection:bg-[#00ffc4] selection:text-black`}>
        <Script
          src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
