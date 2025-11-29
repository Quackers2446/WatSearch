import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import SurveyBanner from "../components/SurveyBanner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "WatSearch - University of Waterloo Academic Hub",
    description:
        "Centralized platform for University of Waterloo students to access course information, assignments, and academic resources.",
    icons: {
        icon: "/favicon.ico",
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Analytics />
                <div className="min-h-screen bg-gray-50">
                    <SurveyBanner />
                    {children}
                </div>
            </body>
        </html>
    )
}
