const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const puppeteer = require("puppeteer")

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"

const interviewReportJsonSchema = {
    type: "object",
    required: [
        "title",
        "matchScore",
        "technicalQuestions",
        "behavioralQuestions",
        "skillGaps",
        "preparationPlan",
    ],
    properties: {
        title: { type: "string", description: "Job role title inferred from the job description" },
        matchScore: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "How well the candidate matches the role (0-100)",
        },
        technicalQuestions: {
            type: "array",
            minItems: 5,
            items: {
                type: "object",
                required: ["question", "intention", "answer"],
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" },
                },
            },
        },
        behavioralQuestions: {
            type: "array",
            minItems: 3,
            items: {
                type: "object",
                required: ["question", "intention", "answer"],
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" },
                },
            },
        },
        skillGaps: {
            type: "array",
            minItems: 2,
            items: {
                type: "object",
                required: ["skill", "severity"],
                properties: {
                    skill: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high"] },
                },
            },
        },
        preparationPlan: {
            type: "array",
            minItems: 5,
            items: {
                type: "object",
                required: ["day", "focus", "tasks"],
                properties: {
                    day: { type: "number" },
                    focus: { type: "string" },
                    tasks: {
                        type: "array",
                        minItems: 2,
                        items: { type: "string" },
                    },
                },
            },
        },
    },
}

const interviewReportSchema = z.object({
    title: z.string().min(1),
    matchScore: z.number().min(0).max(100),
    technicalQuestions: z.array(z.object({
        question: z.string().min(1),
        intention: z.string().min(1),
        answer: z.string().min(1),
    })).min(1),
    behavioralQuestions: z.array(z.object({
        question: z.string().min(1),
        intention: z.string().min(1),
        answer: z.string().min(1),
    })).min(1),
    skillGaps: z.array(z.object({
        skill: z.string().min(1),
        severity: z.enum(["low", "medium", "high"]),
    })).min(1),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string().min(1),
        tasks: z.array(z.string().min(1)).min(1),
    })).min(1),
})

const resumePdfJsonSchema = {
    type: "object",
    required: ["html"],
    properties: {
        html: { type: "string", description: "Full HTML document for the tailored resume" },
    },
}

function getGeminiApiKey() {
    return (
        process.env.GOOGLE_GENAI_API_KEY ||
        process.env.GOOGLE_GEN_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY
    )
}

function inferTitleFromJobDescription(jobDescription) {
    const firstLine = jobDescription
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean)

    if (!firstLine) return "Interview Preparation Plan"
    return firstLine.slice(0, 120)
}

function getAiClient() {
    const apiKey = getGeminiApiKey()
    if (!apiKey) {
        throw new Error(
            "Missing Gemini API key. Set GOOGLE_GENAI_API_KEY in Backend/.env"
        )
    }
    return new GoogleGenAI({ apiKey })
}

function parseModelJson(response) {
    const text = response?.text?.trim()
    if (!text) {
        throw new Error("AI returned an empty response.")
    }
    return JSON.parse(text)
}

function normalizeInterviewReport(data, jobDescription) {
    const parsed = interviewReportSchema.safeParse(data)
    if (!parsed.success) {
        console.error("AI report validation failed:", parsed.error.flatten())
        throw new Error("AI returned an incomplete interview report. Please try again.")
    }

    return {
        ...parsed.data,
        title: parsed.data.title.trim() || inferTitleFromJobDescription(jobDescription),
    }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const ai = getAiClient()

    const prompt = `You are an expert interview coach. Generate a detailed, personalized interview preparation report.

Requirements:
- title: concise job role name from the job description
- matchScore: integer 0-100
- technicalQuestions: at least 5 items with question, intention, and answer
- behavioralQuestions: at least 3 items with question, intention, and answer
- skillGaps: at least 2 items with skill and severity (low|medium|high)
- preparationPlan: at least 5 days with day number, focus, and specific tasks

Resume:
${resume || "(not provided)"}

Self Description:
${selfDescription || "(not provided)"}

Job Description:
${jobDescription}
`

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: interviewReportJsonSchema,
        },
    })

    const raw = parseModelJson(response)
    return normalizeInterviewReport(raw, jobDescription)
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm",
        },
    })

    await browser.close()
    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const ai = getAiClient()

    const prompt = `Generate a tailored resume as one HTML document (field "html") for this candidate.

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

The HTML must be professional, ATS-friendly, and fit on 1-2 printed pages.`

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: resumePdfJsonSchema,
        },
    })

    const jsonContent = parseModelJson(response)
    if (!jsonContent?.html?.trim()) {
        throw new Error("AI returned empty resume HTML.")
    }

    return generatePdfFromHtml(jsonContent.html)
}

module.exports = { generateInterviewReport, generateResumePdf }
