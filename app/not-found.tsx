import Link from "next/link"

export default function NotFound() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-xl text-center py-20 px-6">
                <h1 className="text-6xl font-extrabold mb-4">404</h1>
                <p className="text-xl text-gray-700 mb-6">Page not found.</p>
                <p className="mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-block px-4 py-2 bg-uw-red text-white rounded-lg hover:opacity-95"
                >
                    Go back home
                </Link>
            </div>
        </main>
    )
}
