import { NextResponse } from "next/server";
import { getDB, saveDB, uploadImage } from "../../../lib/blobStore";
import { isAuthed } from "../../../lib/auth";

export async function GET() {
  const db = await getDB();
  return NextResponse.json(db);
}

export async function POST(request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  const title = formData.get("title");

  if (!file || !title) {
    return NextResponse.json({ error: "Title and image are required" }, { status: 400 });
  }

  const imageUrl = await uploadImage(file);
  const work = {
    id: crypto.randomUUID(),
    title: String(title),
    year: String(formData.get("year") || ""),
    medium: String(formData.get("medium") || ""),
    dimensions: String(formData.get("dimensions") || ""),
    series: String(formData.get("series") || ""),
    description: String(formData.get("description") || ""),
    image: imageUrl,
    createdAt: Date.now(),
  };

  const db = await getDB();
  db.works = [work, ...db.works];
  await saveDB(db);

  return NextResponse.json(work, { status: 201 });
}
