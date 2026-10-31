import { requireUser } from "@/lib/auth/guards";
import NotesClient from "@/components/app/NotesClient";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  await requireUser();
  return <NotesClient />;
}
