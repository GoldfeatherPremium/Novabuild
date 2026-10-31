import { requireUser } from "@/lib/auth/guards";
import SecuritySettingsForm from "@/components/app/SecuritySettingsForm";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const user = await requireUser();

  return <SecuritySettingsForm email={user.email ?? ""} />;
}
