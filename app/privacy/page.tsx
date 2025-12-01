import Link from "next/link"

export default function PrivacyPage() {
    return (
        <main className="max-w-3xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-2">
                WatSearch Privacy Policy
            </h1>
            <p className="text-sm text-gray-600 mb-6">
                Last updated: December 1, 2025
            </p>

            <h2 className="text-xl font-semibold mt-4 mb-2">1. Summary</h2>
            <p className="mb-4">
                WatSearch is designed from the ground up to protect user
                privacy. This Privacy Policy explains what information we
                collect, how it is used, and what data never leaves your device.
            </p>

            <p className="mb-4">
                <strong>
                    WatSearch does not upload, store, or process your LEARN
                    course files on any server.
                </strong>
                All course materials you upload (PDFs, slides, HTML,
                assignments, outlines, etc.) are processed entirely inside your
                browser. Your files and extracted text are stored locally on
                your device, using IndexedDB. We do not have access to your
                course content, search queries, or any personal data contained
                within your documents.
            </p>

            <p className="mb-4">
                Minimal, non-sensitive metadata may be stored on our server for
                functionality (e.g., settings, analytics). This metadata never
                includes course files or their contents.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
                2. Information You Upload — Course Materials
            </h2>
            <p className="mb-4">
                When you upload LEARN or other course materials to WatSearch:
            </p>
            <ul className="list-disc pl-5 mb-4">
                <li>Files remain local to your device.</li>
                <li>Files are never transmitted to our servers.</li>
                <li>
                    Parsing, indexing, and search happen entirely client-side.
                </li>
                <li>
                    The processed data is stored in IndexedDB within your
                    browser.
                </li>
            </ul>

            <p className="mb-4">
                Examples of user-uploaded files that stay local:
            </p>
            <ul className="list-disc pl-5 mb-4">
                <li>PDFs (lecture slides, assignments, outlines)</li>
                <li>HTML exports</li>
                <li>Text files</li>
                <li>Images included in course packages</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-2">
                3. Data We Do Not Collect
            </h2>
            <p className="mb-4">
                WatSearch does <strong>NOT</strong> collect or store:
            </p>
            <ul className="list-disc pl-5 mb-4">
                <li>Your LEARN files or any course materials</li>
                <li>Text extracted from your documents</li>
                <li>Your search queries</li>
                <li>Course names or filenames</li>
                <li>Personal student information</li>
                <li>Cookies from the LEARN system</li>
                <li>Any data related to your academic performance</li>
            </ul>

            <p className="mb-4">
                No copies of your files are ever uploaded to our servers.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
                4. Local Storage (IndexedDB)
            </h2>
            <p className="mb-4">
                WatSearch stores user-uploaded files and extracted text in your
                browser’s IndexedDB, which is:
            </p>
            <ul className="list-disc pl-5 mb-4">
                <li>Private to your device</li>
                <li>Cleared when you clear browser data</li>
                <li>Fully under your control</li>
            </ul>

            <p className="mb-4">
                You may delete all locally stored data at any time through your
                browser settings or within the WatSearch interface (if
                provided).
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
                5. Server-Side Data
            </h2>
            <p className="mb-4">
                WatSearch may store limited, non-personal server-side data such
                as:
            </p>
            <ul className="list-disc pl-5 mb-4">
                <li>Deployment logs</li>
                <li>Error reports not containing user files</li>
                <li>Anonymous analytics (e.g., feature usage)</li>
                <li>
                    Non-copyrighted course metadata we generate (e.g., tags,
                    course titles)
                </li>
            </ul>

            <p className="mb-4">
                This data never includes user-uploaded files or their contents.
                We do not store raw course outlines, PDFs, document text, or
                user identifiers tied to academic content.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
                6. Third-Party Services
            </h2>
            <p className="mb-4">
                WatSearch may use third-party services (e.g., Vercel, Firebase)
                for:
            </p>
            <ul className="list-disc pl-5 mb-4">
                <li>Hosting the website</li>
                <li>Authentication (optional)</li>
                <li>Anonymous analytics</li>
            </ul>

            <p className="mb-4">
                These services receive no course content. If authentication is
                used, we only store the minimum required information (e.g., an
                email or ID). Authentication providers do not receive your local
                IndexedDB data.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">7. Security</h2>
            <p className="mb-4">
                Because your course materials never leave your device, the risk
                of unauthorized access is significantly reduced.
            </p>
            <p className="mb-4">However:</p>
            <ul className="list-disc pl-5 mb-4">
                <li>
                    Your files are stored unencrypted within IndexedDB unless
                    explicitly stated otherwise in the app.
                </li>
                <li>Clearing browser data will delete local content.</li>
                <li>
                    Using WatSearch on shared computers may expose your local
                    storage to other users of that device.
                </li>
            </ul>

            <p className="mb-4">
                For maximum privacy, use WatSearch on a personal device.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">8. Your Choices</h2>
            <p className="mb-4">You may:</p>
            <ul className="list-disc pl-5 mb-4">
                <li>Upload or remove course files at any time</li>
                <li>Delete all WatSearch data stored locally</li>
                <li>
                    Use the Service without creating an account (if supported)
                </li>
            </ul>

            <p className="mb-4">
                If you delete your browser data, WatSearch resets completely.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">
                9. Changes to This Policy
            </h2>
            <p className="mb-6">
                We may update this Privacy Policy from time to time. Changes
                take effect when posted. Continued use of WatSearch after
                changes means you accept the updated policy.
            </p>

            <div className="flex gap-4">
                <Link href="/" className="text-sky-600 hover:underline">
                    Back to home
                </Link>
            </div>
        </main>
    )
}
