import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (ext === "txt") {
      const text = buffer.toString("utf-8");
      return NextResponse.json({ text });
    }

    if (ext === "pdf") {
      // Dynamic import to avoid issues with edge runtime
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return NextResponse.json({ text: data.text });
    }

    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ text: result.value });
    }

    return NextResponse.json(
      { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[POST /api/parse-resume]", error);
    return NextResponse.json(
      { error: "Failed to parse resume file." },
      { status: 500 }
    );
  }
}
