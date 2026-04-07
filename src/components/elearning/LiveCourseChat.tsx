import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Wifi, WifiOff } from "lucide-react";
import { api } from "@/integrations/api/client";

interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  user: { id: string; fullName: string | null; avatarUrl: string | null };
}

interface LiveCourseChatProps {
  courseId: number;
  currentUserId?: string;
  currentUserName?: string;
}

const LiveCourseChat = ({ courseId, currentUserId }: LiveCourseChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.request("GET", `/api/course_comments/course/${courseId}?moduleId=0`);
      const data: ChatMessage[] = (res.data || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: c.user || { id: '', fullName: 'Anonyme', avatarUrl: null },
      }));
      // Sort chronologically for chat
      data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(data);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, [courseId]);

  // Poll every 5s for "real-time" feel
  useEffect(() => {
    fetchMessages();
    pollingRef.current = setInterval(fetchMessages, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId || sending) return;
    setSending(true);
    try {
      await api.request("POST", "/api/course_comments", {
        body: { courseId, moduleId: null, content: newMessage.trim() },
      });
      setNewMessage("");
      await fetchMessages(); // Immediate refresh
    } catch {
      // silent
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Chat du cours
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Wifi className="w-3 h-3 text-green-500" /> En ligne
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <WifiOff className="w-3 h-3" /> Hors ligne
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Aucun message pour le moment</p>
            <p className="text-xs">Lancez la discussion !</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user.id === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarFallback className={`text-[10px] ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {getInitials(msg.user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                  <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    {!isOwn && (
                      <p className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.user.fullName || "Anonyme"}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-0.5 ${isOwn ? "text-right" : ""}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <div className="border-t px-3 py-2 flex-shrink-0">
        {currentUserId ? (
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message..."
              className="text-sm h-9"
              maxLength={500}
            />
            <Button
              size="sm"
              className="h-9 w-9 p-0 flex-shrink-0"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-center text-muted-foreground py-1">
            Connectez-vous pour participer au chat
          </p>
        )}
      </div>
    </Card>
  );
};

export default LiveCourseChat;
