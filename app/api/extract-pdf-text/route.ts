import { NextRequest, NextResponse } from "next/server"

// Dynamic import for server-side only
async function extractPDFText(arrayBuffer: ArrayBuffer): Promise<{ text: string; numPages: number }> {
    // Use dynamic import to ensure this only runs server-side
    // pdfjs-serverless is designed for serverless/edge environments
    const { getDocument } = await import("pdfjs-serverless")
    
    // Load the PDF document
    const loadingTask = getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    // Extract text from all pages
    let fullText = ""
    const numPages = pdf.numPages

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        // Combine all text items from the page
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ")
        
        fullText += pageText + "\n"
    }

    return { text: fullText.trim(), numPages }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 },
            )
        }

        // Check if file is PDF
        if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
            return NextResponse.json(
                { success: false, error: "File must be a PDF" },
                { status: 400 },
            )
        }

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        
        // Extract text from PDF
        const { text, numPages } = await extractPDFText(arrayBuffer)

        return NextResponse.json({
            success: true,
            text,
            numPages,
        })
    } catch (error: any) {
        console.error("Error extracting PDF text:", error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to extract text from PDF",
            },
            { status: 500 },
        )
    }
}

