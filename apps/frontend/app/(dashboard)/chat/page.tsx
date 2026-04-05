import { ChatInterface } from "@/app/components/chat/chat-interface";

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
