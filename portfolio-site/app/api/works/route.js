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
  // Newly added pieces go to the end of the list rather than the front.
  // works[0] is treated as the featured piece (see the "Feature" button),
  // so prepending here used to silently steal the featured spot every time
  // a new picture was uploaded. Appending keeps whatever was explicitly
  // featured in place.
  db.works = [...db.works, work];
  await saveDB(db);

  return NextResponse.json(work, { status: 201 });
}
