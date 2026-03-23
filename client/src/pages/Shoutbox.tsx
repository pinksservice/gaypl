import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, MessageSquare, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import type { ShoutboxMessage } from "@shared/schema";

export default function Shoutbox() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<ShoutboxMessage[]>({
    queryKey: ["/api/shoutbox"],
    refetchInterval: 5000,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/shoutbox", { content });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/shoutbox"] });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać wiadomości",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessage.isPending) {
      sendMessage.mutate(message.trim());
    }
  };

  const sortedMessages = messages ? [...messages].reverse() : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold">Czat</h1>
      </div>

      <Card className="h-[calc(100vh-280px)] md:h-[calc(100vh-220px)] flex flex-col">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Publiczny czat
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <MessageSquare className="w-12 h-12" />
              <p>Brak wiadomości</p>
              <p className="text-sm">Bądź pierwszy!</p>
            </div>
          ) : (
            <>
              {sortedMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3 animate-in fade-in duration-300" data-testid={`message-${msg.id}`}>
                  <Avatar className="w-10 h-10 shrink-0">
                    {msg.avatarUrl ? (
                      <AvatarImage src={msg.avatarUrl} alt={msg.username} />
                    ) : null}
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-primary">{msg.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: pl })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground break-words">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>
      </Card>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Napisz wiadomość..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            data-testid="input-shoutbox-message"
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessage.isPending}
            data-testid="button-send-message"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">
              <Button variant="ghost" className="text-primary p-0 h-auto" onClick={() => window.location.href = "/login"}>
                Zaloguj się
              </Button>
              {" "}aby pisać wiadomości
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
