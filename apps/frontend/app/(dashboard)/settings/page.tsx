"use client";

import { WhatsAppLink } from "@/app/components/settings/whatsapp-link";
import { TelegramLink } from "@/app/components/settings/telegram-link";

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col bg-white">
      <main className="flex-1 px-4 md:px-6 py-6 md:py-8">
        <div className="mx-auto max-w-160">
          <h1 className="text-[13px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-6">
            Settings
          </h1>

          <section className="mb-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-900 mb-3">
              Integrations
            </h2>
            <div className="mb-4">
              <TelegramLink />
            </div>
            <WhatsAppLink />
          </section>
        </div>
      </main>
    </div>
  );
}
