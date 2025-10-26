import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'WatSearch - University of Waterloo Academic Hub',
    description: 'Centralized platform for University of Waterloo students to access course information, assignments, and academic resources.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen bg-gray-50">
                    {children}
                </div>
            </body>
        </html>
    )
}
