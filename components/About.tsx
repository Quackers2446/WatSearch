import Link from "next/link"

export default function About() {
    return (
        <main className="max-w-3xl mx-auto py-16 px-4">
            <h1 className="text-4xl font-bold mb-4">About WatSearch</h1>

            <p className="text-lg text-muted-foreground mb-6 italic">
                A centralized platform for integrating academic information from
                various University of Waterloo platforms (LEARN, Quest, Piazza,
                departmental websites) into a single searchable and queryable
                service.
            </p>

            <p className="text-lg text-muted-foreground mb-6">
                WatSearch is currently a course browser and study helper for
                University course outlines and materials. It collects course
                outlines and exposes them through a simple search and browsing
                interface. The project also includes a browser extension that
                surfaces additional features while navigating course pages.
            </p>
            <section className="prose mb-6">
                <h2 className="text-2xl font-semibold">What it does</h2>
                <ul className="list-disc ml-6">
                    <li>
                        Parses course outline HTML and normalizes course
                        metadata.
                    </li>
                    <li>
                        Surfaces assessments, readings, and schedules in a
                        searchable UI.
                    </li>
                    <li>
                        Includes a browser extension for quick actions while
                        viewing course outlines.
                    </li>
                </ul>
            </section>
            <section className="mb-6">
                <h2 className="text-2xl font-semibold">Contributing</h2>
                <p>
                    Contributions, issues and feature requests are welcome. See
                    the repository on GitHub for the source code and
                    contribution guidelines.
                </p>
                <p className="mt-2">
                    <a
                        href="https://github.com/Quackers2446/WatSearch"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 underline"
                    >
                        GitHub — WatSearch
                    </a>
                </p>
            </section>
            <section>
                <h2 className="text-2xl font-semibold">Contact</h2>
                <p>
                    If you need help or want to share data sources, open an
                    issue on the repository or email the maintainer listed in
                    the project metadata.
                </p>
            </section>
        </main>
    )
}
