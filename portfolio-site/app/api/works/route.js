import { NextResponse } from "next/server";
import { getDB, saveDB, uploadImage } from "../../../../lib/blobStore";
import { isAuthed } from "../../../../lib/auth";

export async function PUT(request, { params }) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const db = await getDB();
  const idx = db.works.findIndex((w) => w.id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  const existing = db.works[idx];
  const imageUrl = file && file.size > 0 ? await uploadImage(file) : existing.image;

  const updated = {
    ...existing,
    title: String(formData.get("title") || existing.title),
    year: String(formData.get("year") || ""),
    medium: String(formData.get("medium") || ""),
    dimensions: String(formData.get("dimensions") || ""),
    series: String(formData.get("series") || ""),
    description: String(formData.get("description") || ""),
    image: imageUrl,
  };

  db.works[idx] = updated;
  await saveDB(db);

  return NextResponse.json(updated);
}

export async function PATCH(request, { params }) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const db = await getDB();
  const idx = db.works.findIndex((w) => w.id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [work] = db.works.splice(idx, 1);
  db.works.unshift(work);
  await saveDB(db);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const db = await getDB();
  db.works = db.works.filter((w) => w.id !== params.id);
  await saveDB(db);

  return NextResponse.json({ ok: true });
}
