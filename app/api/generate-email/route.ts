import { NextResponse } from "next/server";
import { GenerateEmailRequest } from "@/types/job";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/auto";

export async function POST(request: Request) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured." },
        { status: 500 }
      );
    }

    const body: GenerateEmailRequest = await request.json();
    const { job, resumeText } = body;

    if (!job) {
      return NextResponse.json({ error: "Job data is required." }, { status: 400 });
    }

    // Read at request time so env vars are always fresh after restarts
    const candidate = {
      name: process.env.CANDIDATE_NAME || "",
      email: process.env.CANDIDATE_EMAIL || "",
      phone: process.env.CANDIDATE_PHONE || "",
      linkedin: process.env.CANDIDATE_LINKEDIN || "",
      github: process.env.CANDIDATE_GITHUB || "",
    };

    // Always append candidate signature — even when resume is uploaded
    const signatureBlock = `
## Candidate Signature (always use this at the end)
Name: ${candidate.name}
Email: ${candidate.email}
Phone: ${candidate.phone}
LinkedIn: ${candidate.linkedin}
GitHub: ${candidate.github}`;

    const candidateSection = resumeText
      ? `## Candidate Resume\n${resumeText.slice(0, 3000)}\n${signatureBlock}`
      : `## Candidate Details
- Name: ${candidate.name}
- Email: ${candidate.email}
- Phone: ${candidate.phone}
- LinkedIn: ${candidate.linkedin}
- GitHub: ${candidate.github}`;

    const prompt = `You are an expert career coach and professional email writer.

Write a highly personalized, compelling job application email based on the details below.

## Job Details
- Title: ${job.title}
- Company: ${job.company_name || job.company || "the company"}
- Industry: ${job.industry || "Not specified"}
- Location: ${job.location}
- Description: ${job.description?.slice(0, 2000)}
${job.company_summary ? `- About the company: ${job.company_summary}` : ""}

${candidateSection}

## Instructions
1. Write a professional email subject line (prefix with "SUBJECT: ")
2. Then write the full email body starting with "BODY:"
3. The email should:
   - Open with a strong hook showing genuine interest in this specific role
   - Highlight 2-3 skills/experiences that match the job requirements
   - Be concise (250-350 words for the body)
   - Sound human, confident, and enthusiastic — not robotic
4. IMPORTANT: Always sign off with EXACTLY this name: ${candidate.name}
5. IMPORTANT: Always end with EXACTLY this signature block:

Best regards,
${candidate.name}
${candidate.email} | ${candidate.phone}
LinkedIn: ${candidate.linkedin}
GitHub: ${candidate.github}

6. Do NOT invent or use any other name, email, or contact details
7. Format: SUBJECT: <subject line>\n\nBODY:\n<email body>`;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Job Application Dashboard",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[OpenRouter error]", response.status, errText);
      return NextResponse.json(
        { error: `AI service error: ${response.status}. Please try again.` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content || "";

    if (!content) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    // Parse subject and body
    const subjectMatch = content.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i);

    const subject =
      subjectMatch?.[1]?.trim() ||
      job.email_subject ||
      `Application for ${job.title}`;
    const emailBody = bodyMatch?.[1]?.trim() || content.trim();

    return NextResponse.json({ subject, body: emailBody });
  } catch (error) {
    console.error("[POST /api/generate-email]", error);
    return NextResponse.json(
      { error: "Failed to generate email. Please try again." },
      { status: 500 }
    );
  }
}
