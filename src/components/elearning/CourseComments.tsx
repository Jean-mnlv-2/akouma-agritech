import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Reply, Trash2, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: { id: string; fullName: string | null; avatarUrl: string | null };
  replies?: Comment[];
}

interface CourseCommentsProps {
  courseId: number;
  moduleId?: number;
  currentUserId?: string;
}

const CourseComments = ({ courseId, moduleId, currentUserId }: CourseCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ["comments", courseId, moduleId];

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey,
    queryFn: async () => {
      const params = moduleId ? `?moduleId=${moduleId}` : "";
      const res = await api.request("GET", `/api/course_comments/course/${courseId}${params}`);
      return res.data || [];
    },
    staleTime: 30000,
  });

  const postMutation = useMutation({
    mutationFn: async (payload: { content: string; parentId?: number }) => {
      return api.request("POST", "/api/course_comments", {
        body: { courseId, moduleId: moduleId || null, ...payload },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment("");
      setReplyTo(null);
      setReplyContent("");
      toast({ title: "Commentaire publié !" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de publier le commentaire", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.request("DELETE", `/api/course_comments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Commentaire supprimé" });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    postMutation.mutate({ content: newComment.trim() });
  };

  const handleReply = (parentId: number) => {
    if (!replyContent.trim()) return;
    postMutation.mutate({ content: replyContent.trim(), parentId });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Discussions
          <Badge variant="outline" className="ml-2">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New comment form */}
        {currentUserId ? (
          <div className="flex gap-3">
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Écrire un commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || postMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publier
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm bg-muted/30 rounded-lg">
            Connectez-vous pour participer aux discussions
          </div>
        )}

        {/* Comments list */}
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Chargement...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun commentaire pour le moment</p>
            <p className="text-xs mt-1">Soyez le premier à lancer la discussion !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                {/* Main comment */}
                <div className="flex gap-3 group">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(comment.user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{comment.user.fullName || "Utilisateur"}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {currentUserId && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                          <Reply className="w-3 h-3 mr-1" /> Répondre
                        </Button>
                      )}
                      {currentUserId === comment.user.id && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100" onClick={() => deleteMutation.mutate(comment.id)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply form */}
                {replyTo === comment.id && currentUserId && (
                  <div className="ml-12 flex gap-2">
                    <Textarea
                      placeholder="Votre réponse..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[60px] resize-none text-sm"
                    />
                    <Button size="sm" onClick={() => handleReply(comment.id)} disabled={!replyContent.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-12 space-y-3 border-l-2 border-primary/10 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3 group">
                        <Avatar className="w-7 h-7 flex-shrink-0">
                          <AvatarFallback className="bg-accent/10 text-accent text-[10px]">
                            {getInitials(reply.user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-xs">{reply.user.fullName || "Utilisateur"}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDate(reply.createdAt)}</span>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                          {currentUserId === reply.user.id && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 mt-1" onClick={() => deleteMutation.mutate(reply.id)}>
                              <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseComments;
