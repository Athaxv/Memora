import Link from "next/link";
import { ChatInterface } from "@/app/components/chat/chat-interface";

export default function ChatPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          &larr; Dashboard
        </Link>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Memory Chat
        </h1>
      </header>

      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
