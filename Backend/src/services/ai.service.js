const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");
const PDFDocument = require("pdfkit");

const googleGenAiApiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY

if (!googleGenAiApiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY or GEMINI_API_KEY environment variable is not set")
}

const ai = new GoogleGenAI({
    apiKey: googleGenAiApiKey
});

const interviewReportSchema = z.object({
    matchScore: z.number(),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"])
    })),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string())
    })),
    title: z.string(),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
        const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            }
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("AI Service Error:", error.message);
        throw new Error(`Failed to generate interview report: ${error.message}`);
    }
}

/**
 * FIXED PUPPETEER FUNCTION
 */
async function generatePdfFromHtml(htmlContent) {
    try {
        console.log("🚀 Launching Puppeteer...");

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });

        const page = await browser.newPage();

        await page.setContent(htmlContent, {
            waitUntil: "domcontentloaded", //  FIX (networkidle0 sometimes fails)
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm",
            },
        });

        await browser.close();

        return pdfBuffer;

    } catch (error) {
        console.error("PUPPETEER ERROR:", error);
        // Fallback: use PDFKit to create a simple PDF if Puppeteer/Chrome is not available
        try {
            console.warn("Falling back to pdfkit for PDF generation.");

            // Improved HTML-aware rendering into PDF using PDFKit.
            // Handles headings, paragraphs, ordered/unordered lists, bold and italics, and <br>.
            const doc = new PDFDocument({ autoFirstPage: true, margin: 40 })

            const buffers = []
            doc.on('data', (chunk) => buffers.push(chunk))
            doc.on('end', () => {})

            // Default font
            doc.font('Helvetica')
            doc.fontSize(12)

            // Tokenize simple HTML into tags and text
            const tokens = String(htmlContent).match(/<[^>]+>|[^<]+/g) || [String(htmlContent)]
            const tagStack = []
            const listCounters = []

            for (let raw of tokens) {
                raw = raw.replace(/\r/g, '')
                if (!raw) continue

                if (raw.startsWith('<')) {
                    const tag = raw.replace(/[<>\/]/g, '').split(/\s+/)[0].toLowerCase()
                    const isClosing = /^<\//.test(raw)

                    if (!isClosing) {
                        // Opening tags
                        tagStack.push(tag)
                        if (tag === 'h1') { doc.moveDown(0.6); doc.fontSize(20); doc.font('Helvetica-Bold') }
                        else if (tag === 'h2') { doc.moveDown(0.5); doc.fontSize(16); doc.font('Helvetica-Bold') }
                        else if (tag === 'h3') { doc.moveDown(0.4); doc.fontSize(14); doc.font('Helvetica-Bold') }
                        else if (tag === 'p') { /* paragraph start */ }
                        else if (tag === 'br') { doc.moveDown(0.3) }
                        else if (tag === 'ul') { listCounters.push(null) }
                        else if (tag === 'ol') { listCounters.push(1) }
                        else if (tag === 'li') { /* list item; handled when text appears */ }
                        else if (tag === 'strong' || tag === 'b') { doc.font('Helvetica-Bold') }
                        else if (tag === 'em' || tag === 'i') { doc.font('Helvetica-Oblique') }
                    } else {
                        // Closing tags
                        const closeTag = tag
                        // pop until we remove the matching open tag
                        for (let i = tagStack.length - 1; i >= 0; i--) {
                            if (tagStack[i] === closeTag) { tagStack.splice(i, 1); break }
                        }

                        if (closeTag === 'h1' || closeTag === 'h2' || closeTag === 'h3') { doc.fontSize(12); doc.font('Helvetica'); doc.moveDown(0.3) }
                        else if (closeTag === 'p') { doc.moveDown(0.3) }
                        else if (closeTag === 'ul' || closeTag === 'ol') { listCounters.pop(); doc.moveDown(0.1) }
                        else if (closeTag === 'li') { doc.moveDown(0.1) }
                        else if (closeTag === 'strong' || closeTag === 'b' || closeTag === 'em' || closeTag === 'i') { doc.font('Helvetica') }
                    }
                } else {
                    // Plain text node
                    let text = raw.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
                    if (!text) continue

                    const currentTag = tagStack[tagStack.length - 1]
                    if (currentTag === 'li') {
                        const parent = tagStack.slice().reverse().find(t => t === 'ul' || t === 'ol')
                        if (parent === 'ol') {
                            const idx = listCounters[listCounters.length - 1] || 1
                            doc.text(`${idx}. ${text}`, { indent: 20 })
                            listCounters[listCounters.length - 1] = idx + 1
                        } else {
                            doc.text(`• ${text}`, { indent: 20 })
                        }
                    } else {
                        doc.text(text)
                    }
                }
            }

            doc.end()

            const pdfBuffer = await new Promise((resolve) => {
                doc.on('end', () => resolve(Buffer.concat(buffers)))
            })

            return pdfBuffer
        } catch (fallbackError) {
            console.error('PDFKit fallback failed:', fallbackError)
            throw error // rethrow original puppeteer error
        }
    }
}

/**
 * Resume PDF generator
 */
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string(),
    });

    const prompt = `Generate resume for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Return JSON with field "html".`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        },
    });

    const jsonContent = JSON.parse(response.text);

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

    return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };