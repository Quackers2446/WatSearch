"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error
    reset: () => void
}) {
    useEffect(() => {
        console.error("Unhandled error (GlobalError):", error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-xl w-full bg-white rounded-lg shadow p-6 text-center">
                <h1 className="text-2xl font-bold mb-2">
                    Something went wrong
                </h1>
                <p className="text-sm text-gray-600 mb-4">
                    Please let us know in the survey about your experience!
                </p>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-uw-red text-white rounded hover:opacity-95"
                    >
                        Go home
                    </button>
                </div>

                {/* <details className="mt-4 text-left text-xs text-gray-500">
                    <summary className="cursor-pointer">Error details</summary>
                    <pre className="whitespace-pre-wrap mt-2">
                        {String(error?.stack ?? error?.message)}
                    </pre>
                </details> */}
            </div>
        </div>
    )
}
