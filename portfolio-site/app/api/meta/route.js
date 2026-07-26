import { NextResponse } from "next/server";
import { getDB, saveDB } from "../../../lib/blobStore";
import { isAuthed } from "../../../lib/auth";

export async function PUT(request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await request.json();
  const db = await getDB();
  db.meta = { ...db.meta, ...body };
  await saveDB(db);

  return NextResponse.json(db.meta);
}
