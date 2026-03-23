import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types matching the OpenAI integration output
interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// These endpoints come from the OpenAI Integration blueprint
const API_CONVERSATIONS = "/api/conversations";

export function useConversations() {
  return useQuery({
    queryKey: [API_CONVERSATIONS],
    queryFn: async () => {
      const res = await fetch(API_CONVERSATIONS, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return (await res.json()) as Conversation[];
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: [API_CONVERSATIONS, id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`${API_CONVERSATIONS}/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return (await res.json()) as Conversation & { messages: Message[] };
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string = "Nowa Rozmowa") => {
      const res = await fetch(API_CONVERSATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return (await res.json()) as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_CONVERSATIONS] });
    },
  });
}

// Custom hook for streaming chat messages
export function useChatStream(conversationId: number) {
  const queryClient = useQueryClient();
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (content: string) => {
    setIsStreaming(true);
    setStreamingContent(""); // Clear previous stream

    // Optimistic update could go here, but for streaming we usually wait for chunk 1
    
    try {
      const res = await fetch(`${API_CONVERSATIONS}/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                // Stream finished
              } else if (data.content) {
                setStreamingContent((prev) => prev + data.content);
              } else if (data.error) {
                console.error("Stream error:", data.error);
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      // Refresh full history
      queryClient.invalidateQueries({ queryKey: [API_CONVERSATIONS, conversationId] });
    }
  };

  return { sendMessage, streamingContent, isStreaming };
}
