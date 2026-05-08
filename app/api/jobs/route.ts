import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const db = await getDb();
    const collection = db.collection("jobs");

    // Build filter
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { company_name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { industry: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      filter.status = status;
    }

    const [jobs, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    const serialized = jobs.map((job) => ({
      ...job,
      _id: job._id.toString(),
    }));

    return NextResponse.json({
      jobs: serialized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/jobs]", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs. Please check your MongoDB connection." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Job ID is required." }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("jobs");

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updated_at: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/jobs]", error);
    return NextResponse.json(
      { error: "Failed to update job." },
      { status: 500 }
    );
  }
}
