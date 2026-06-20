import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Plus, Send, Trash2, Loader2, MessageSquare, Bot, User as UserIcon, ArrowLeft } from "lucide-react";
import { api } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

type ThreadSummary = { id: string; title: string; updatedAt: string };
type ChatMsg = { id: string; role: "user" | "assistant"; content: string; pending?: boolean };

function getApiBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL as string;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "kilimo.onrender.com") return "https://kilimo-backend.onrender.com";
    if (window.location.hostname.includes("onrender.com")) return window.location.origin;
    if (window.location.port === "8080") return window.location.origin;
  }
  return "http://localhost:4000";
}

function csrfCookie(): string | null {
  const all = document.cookie ? document.cookie.split(";") : [];
  for (const part of all) {
    const [k, ...rest] = part.trim().split("=");
    if (k === "csrf_token") return decodeURIComponent(rest.join("="));
  }
  return null;
}

export default function Assistant() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auth gate
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.auth.getSession();
        if (!data?.session?.user) {
          navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        setAuthed(true);
      } catch {
        navigate("/auth");
      } finally {
        setAuthReady(true);
      }
    })();
  }, [navigate]);

  // Load thread list
  const refreshThreads = useCallback(async () => {
    try {
      const res = await api.request("GET", "/api/chat/threads");
      setThreads(res.data || []);
      return res.data as ThreadSummary[];
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  // Bootstrap: load threads, navigate to first or create one
  useEffect(() => {
    if (!authed) return;
    (async () => {
      const list = await refreshThreads();
      if (!threadId) {
        if (list.length > 0) {
          navigate(`/assistant/${list[0].id}`, { replace: true });
        } else {
          try {
            const res = await api.request("POST", "/api/chat/threads", { body: {} });
            await refreshThreads();
            navigate(`/assistant/${res.data.id}`, { replace: true });
          } catch (e) {
            toast.error("Impossible de créer une conversation");
          }
        }
      }
    })();
  }, [authed, threadId, navigate, refreshThreads]);

  // Load messages for active thread
  useEffect(() => {
    if (!threadId || !authed) return;
    let cancelled = false;
    setLoadingThread(true);
    (async () => {
      try {
        const res = await api.request("GET", `/api/chat/threads/${threadId}`);
        if (cancelled) return;
        setMessages((res.data.messages || []).map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
      } catch (e) {
        if (!cancelled) {
          setMessages([]);
          toast.error("Conversation introuvable");
          navigate("/assistant", { replace: true });
        }
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    })();
    return () => { cancelled = true; };
  }, [threadId, authed, navigate]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  // Focus textarea on thread change
  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  const createThread = useCallback(async () => {
    try {
      const res = await api.request("POST", "/api/chat/threads", { body: {} });
      await refreshThreads();
      navigate(`/assistant/${res.data.id}`);
      setMessages([]);
    } catch {
      toast.error("Création impossible");
    }
  }, [navigate, refreshThreads]);

  const deleteThread = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette conversation ?")) return;
    try {
      await api.request("DELETE", `/api/chat/threads/${id}`);
      const list = await refreshThreads();
      if (id === threadId) {
        navigate(list.length > 0 ? `/assistant/${list[0].id}` : "/assistant", { replace: true });
      }
    } catch {
      toast.error("Suppression impossible");
    }
  }, [navigate, refreshThreads, threadId]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || streaming || !threadId) return;

    setInput("");
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content };
    const assistantId = `a-${Date.now()}`;
    setMessages(prev => [...prev, userMsg, { id: assistantId, role: "assistant", content: "", pending: true }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "text/event-stream" };
      const csrf = csrfCookie();
      if (csrf) headers["x-csrf-token"] = csrf;

      const res = await fetch(`${getApiBase()}/api/chat/threads/${threadId}/messages`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let errorPayload: { message?: string } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          const lines = block.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          try {
            const payload = JSON.parse(data);
            if (event === "delta" && typeof payload.content === "string") {
              acc += payload.content;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: acc, pending: false } : m));
            } else if (event === "error") {
              errorPayload = payload;
            }
          } catch { /* ignore */ }
        }
      }

      if (errorPayload) {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `⚠️ ${errorPayload?.message || "Erreur"}`, pending: false } : m));
        toast.error(errorPayload.message || "Erreur");
      } else if (!acc) {
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      } else {
        refreshThreads();
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: "⚠️ Erreur réseau. Réessayez.", pending: false } : m));
        toast.error("Erreur de connexion");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [input, streaming, threadId, refreshThreads]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const empty = useMemo(() => messages.length === 0 && !loadingThread, [messages, loadingThread]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container mx-auto flex flex-1 flex-col px-2 py-4 md:px-6 md:py-8">
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
          {/* Sidebar threads */}
          <aside className="hidden flex-col rounded-xl border bg-card md:flex">
            <div className="flex items-center justify-between gap-2 border-b p-3">
              <div className="flex items-center gap-2 font-semibold">
                <MessageSquare className="h-4 w-4" /> Conversations
              </div>
              <Button size="sm" variant="ghost" onClick={createThread} aria-label="Nouvelle conversation">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <ul className="p-2">
                {threads.length === 0 && (
                  <li className="px-2 py-4 text-sm text-muted-foreground">Aucune conversation</li>
                )}
                {threads.map(t => (
                  <li key={t.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/assistant/${t.id}`)}
                      onKeyDown={(e) => { if (e.key === "Enter") navigate(`/assistant/${t.id}`); }}
                      className={cn(
                        "group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-accent",
                        t.id === threadId && "bg-accent font-medium"
                      )}
                    >
                      <span className="line-clamp-1 flex-1">{t.title}</span>
                      <button
                        type="button"
                        onClick={(e) => deleteThread(t.id, e)}
                        className="opacity-0 transition group-hover:opacity-100"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </aside>

          {/* Chat panel */}
          <section className="flex min-h-[70vh] flex-col rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b p-3">
              <Button size="icon" variant="ghost" className="md:hidden" onClick={() => navigate(-1)} aria-label="Retour">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">KILIMO Assistant</div>
                <div className="text-xs text-muted-foreground">En ligne · Réponses IA</div>
              </div>
              <Button size="sm" variant="outline" onClick={createThread} className="md:hidden">
                <Plus className="mr-1 h-3.5 w-3.5" /> Nouvelle
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
              {loadingThread ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : empty ? (
                <EmptyState onPick={(p) => { setInput(p); setTimeout(() => inputRef.current?.focus(), 0); }} />
              ) : (
                <ul className="space-y-4">
                  {messages.map(m => (
                    <li key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                      {m.role === "assistant" && (
                        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm md:max-w-[70%]",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}>
                        {m.role === "assistant" ? (
                          m.pending && !m.content ? (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "0ms" }} />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "120ms" }} />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "240ms" }} />
                            </span>
                          ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                            </div>
                          )
                        ) : (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        )}
                      </div>
                      {m.role === "user" && (
                        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t p-3 md:p-4">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Posez votre question à KILIMO Assistant…"
                  rows={1}
                  className="max-h-40 min-h-[44px] resize-none"
                  disabled={streaming || !threadId}
                />
                {streaming ? (
                  <Button type="button" variant="outline" onClick={stopStream} aria-label="Arrêter">
                    Stop
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={sendMessage}
                    disabled={!input.trim() || !threadId}
                    aria-label="Envoyer"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                KILIMO Assistant peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (p: string) => void }) {
  const prompts = [
    "Quelles formations en agroécologie proposez-vous ?",
    "Comment passer une commande de semences ?",
    "Quels sont les bons gestes pour planter du maïs ?",
    "Comment obtenir mon certificat après une formation ?",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Bot className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Bonjour 👋</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Je suis KILIMO Assistant. Posez-moi vos questions sur les formations, la boutique, l'agriculture ou nos services.
        </p>
      </div>
      <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {prompts.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="rounded-xl border bg-background px-3 py-2.5 text-left text-sm transition hover:border-primary hover:bg-accent"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}