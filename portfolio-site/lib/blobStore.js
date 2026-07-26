import { put, list } from "@vercel/blob";

const DB_PATH = "db.json";
const DEFAULT_DB = { meta: { artistName: "Artist Name", bio: "" }, works: [] };

async function findDbBlob() {
  const { blobs } = await list({ prefix: DB_PATH });
  return blobs.find((b) => b.pathname === DB_PATH) || null;
}

export async function getDB() {
  const blob = await findDbBlob();
  if (!blob) return DEFAULT_DB;
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return DEFAULT_DB;
  return res.json();
}

export async function saveDB(db) {
  await put(DB_PATH, JSON.stringify(db), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function uploadImage(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `works/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(path, file, { access: "public" });
  return blob.url;
}
