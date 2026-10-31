"use client";

import { useState, useTransition } from "react";
import { Loader2, User } from "lucide-react";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/app/Toast";
import { updateProfile, updateAvatar, type ActionResult } from "@/lib/auth/actions";

export default function ProfileSettingsForm({ data }: { data: { fullName: string; profession: string; interests: string[]; email: string } }) {
  const { toast } = useToast();
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [avatarPending, setAvatarPending] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(state, formData);
      setState(result);
      if (result.ok) toast("Profile updated", "success");
      else if (result.error && result.error !== "SERVICE_NOT_CONFIGURED") toast(result.error, "error");
    });
  }

  function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    setAvatarPending(true);
    (async () => {
      const result = await updateAvatar(fd);
      setAvatarPending(false);
      if (result.ok) toast("Avatar updated", "success");
      else toast(result.error ?? "Avatar update failed", "error");
    })();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="panel flex flex-col items-center gap-4 p-8 text-center lg:col-span-1">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-violet/30 bg-violet/10">
          <User className="h-9 w-9 text-violet-soft" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-ink">{data.fullName || "Researcher"}</p>
          <p className="text-[12.5px] text-muted">{data.email}</p>
        </div>
        <label className="btn-ghost cursor-pointer px-5 py-2.5 text-[13px]">
          {avatarPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change avatar"}
          <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
        </label>
      </div>

      <form onSubmit={onSubmit} className="panel flex flex-col gap-4 p-6 lg:col-span-2">
        <h2 className="text-[16px] font-semibold text-ink">Profile</h2>
        <Input name="fullName" label="Full name" defaultValue={data.fullName} error={state?.fieldErrors?.fullName} />
        <Input name="profession" label="Profession / occupation" defaultValue={data.profession} placeholder="e.g. PhD candidate, Analyst" />
        <Input name="interests" label="Research interests (comma separated)" defaultValue={data.interests.join(", ")} placeholder="e.g. neuroscience, ML, public health" />
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-primary px-6 py-3 text-[14px] disabled:opacity-60">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
