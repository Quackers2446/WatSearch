"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function SurveyBanner() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        try {
            const stored = localStorage.getItem("surveyBannerHidden")
            if (!stored || stored === "0") setVisible(true)
        } catch (e) {
            // ignore
        }
    }, [])

    const hide = () => {
        setVisible(false)
        try {
            localStorage.setItem("surveyBannerHidden", "1")
        } catch (e) {
            // ignore
        }
    }

    if (!visible) return null

    return (
        <div className="w-full bg-yellow-50 border-b border-yellow-200">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                <div className="text-sm text-yellow-900">
                    Help improve WatSearch — please take our{" "}
                    <Link
                        href="https://forms.gle/eft4PSgGa4ziN6XX9"
                        className="font-semibold underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        short survey
                    </Link>
                    .
                </div>

                <div>
                    <button
                        onClick={hide}
                        className="text-sm text-yellow-900 bg-transparent hover:opacity-80 px-3 py-1 rounded"
                        aria-label="Dismiss survey banner"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    )
}
