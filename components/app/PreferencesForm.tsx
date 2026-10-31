"use client";

import { useState, useTransition } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/app/Toast";
import { updatePreferences, type ActionResult } from "@/lib/auth/actions";

export default function PreferencesForm({ data }: { data: { theme: string; language: string; notifyEmail: boolean; aiModelPref: string } }) {
  const { toast } = useToast();
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="panel flex max-w-2xl flex-col gap-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await updatePreferences(state, fd);
          setState(r);
          if (r.ok) toast("Preferences saved", "success");
          else if (r.error) toast(r.error, "error");
        });
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet/25 bg-violet/10">
          <SlidersHorizontal className="h-4.5 w-4.5 text-violet-soft" />
        </span>
        <h2 className="text-[15.5px] font-semibold text-ink">Preferences</h2>
      </div>

      <Select name="theme" label="Theme" defaultValue={data.theme}>
        <option value="dark">Dark (recommended)</option>
        <option value="light">Light</option>
      </Select>

      <Select name="language" label="Language" defaultValue={data.language}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
        <option value="ja">日本語</option>
      </Select>

      <Input name="aiModelPref" label="Preferred AI model (optional)" defaultValue={data.aiModelPref} placeholder="e.g. gpt-4o-mini" />

      <Checkbox name="notifyEmail" label="Email me about important updates (billing, security, long-processing results)" defaultChecked={data.notifyEmail} />

      <div className="flex justify-end border-t border-white/[0.06] pt-4">
        <button type="submit" disabled={pending} className="btn-primary px-6 py-3 text-[14px] disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
