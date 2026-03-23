import { useEffect, useRef, useState } from "react";
import { useConversations, useCreateConversation, useChatStream, useConversation } from "@/hooks/use-ai-chat";
import { Send, Plus, MessageSquare, Bot, User as UserIcon } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";

export default function AiChat() {
  const { data: conversations } = useConversations();
  const { mutate: createConversation } = useCreateConversation();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (conversations?.length && !selectedId) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  return (
    <div className="grid md:grid-cols-[280px_1fr] h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] gap-6">
      {/* Sidebar List */}
      <div className="bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <button
            onClick={() => createConversation()}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 py-3 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nowa rozmowa
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={clsx(
                "w-full text-left px-4 py-3 rounded-lg text-sm transition-colors flex items-center gap-3",
                selectedId === conv.id 
                  ? "bg-white/5 text-white border border-white/10" 
                  : "text-muted-foreground hover:bg-white/5"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <div className="truncate font-medium">{conv.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-card rounded-2xl border border-border flex flex-col overflow-hidden relative">
        {selectedId ? (
          <ChatInterface conversationId={selectedId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <Bot className="w-16 h-16 mb-4 text-primary/20" />
            <h3 className="text-xl font-bold text-white mb-2">Twój AI Asystent</h3>
            <p>Wybierz rozmowę lub rozpocznij nową, aby pogadać.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatInterface({ conversationId }: { conversationId: number }) {
  const { data: conversation } = useConversation(conversationId);
  const { sendMessage, streamingContent, isStreaming } = useChatStream(conversationId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm z-10">
        <h2 className="font-bold text-white truncate">{conversation?.title}</h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {conversation?.messages?.map((msg) => (
          <div key={msg.id} className={clsx("flex gap-4", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div className={clsx(
              "max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
              msg.role === "user" 
                ? "bg-primary text-black font-medium rounded-tr-none" 
                : "bg-white/5 text-gray-100 border border-white/10 rounded-tl-none"
            )}>
              {msg.content}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming Message Bubble */}
        {isStreaming && streamingContent && (
           <div className="flex gap-4 justify-start">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="max-w-[80%] px-5 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed whitespace-pre-wrap bg-white/5 text-gray-100 border border-white/10 border-primary/30">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle animate-pulse" />
              </div>
           </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSubmit} className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Napisz wiadomość..."
            disabled={isStreaming}
            className="w-full bg-background border border-border rounded-xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 top-2 p-2 bg-primary text-black rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:bg-white/10 disabled:text-gray-500 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </>
  );
}
