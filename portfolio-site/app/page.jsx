import { getDB } from "../lib/blobStore";
import Gallery from "../components/Gallery";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await getDB();
  return <Gallery meta={db.meta} works={db.works} />;
}
