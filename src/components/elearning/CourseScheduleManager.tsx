import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";

interface CourseScheduleProps {
  enrollmentId: number;
  courseId: number;
  userId: string;
}

const timeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
  "20:00 - 22:00",
];

const CourseScheduleManager = ({ enrollmentId, courseId, userId }: CourseScheduleProps) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery<any[]>({
    queryKey: ["schedules", enrollmentId],
    queryFn: async () => {
      const res = await api.request("GET", "/api/course_schedules/my");
      return (res.data || []).filter((s: any) => s.enrollmentId === enrollmentId);
    },
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.request("POST", "/api/course_schedules", {
        body: { enrollmentId, courseId, scheduledDate: selectedDate, timeSlot: selectedSlot },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", enrollmentId] });
      setSelectedDate("");
      setSelectedSlot("");
      toast({ title: "Créneau confirmé", description: "Votre horaire est verrouillé. Soyez ponctuel !" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le créneau", variant: "destructive" });
    },
  });

  const totalAbsences = schedules.filter(s => s.status === "absent").length;
  const hasPenalty = totalAbsences >= 3;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "attended": return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" /> Présent</Badge>;
      case "absent": return <Badge className="bg-red-100 text-red-800 border-red-300"><AlertTriangle className="w-3 h-3 mr-1" /> Absent</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-800 border-blue-300"><Clock className="w-3 h-3 mr-1" /> Programmé</Badge>;
    }
  };

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Mes horaires de cours
        </CardTitle>
        {totalAbsences > 0 && (
          <div className={`flex items-center gap-2 text-sm mt-2 ${hasPenalty ? 'text-destructive' : 'text-yellow-600'}`}>
            <AlertTriangle className="w-4 h-4" />
            {totalAbsences} absence(s) {hasPenalty && "— pénalité de progression appliquée"}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new schedule */}
        <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
          <p className="text-sm font-medium">Choisir un créneau horaire</p>
          <p className="text-xs text-muted-foreground">
            ⚠️ Une fois confirmé, le créneau est <strong>verrouillé</strong>. Toute absence sera comptabilisée.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Créneau</label>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un horaire" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!selectedDate || !selectedSlot || createMutation.isPending}
          >
            <Lock className="w-4 h-4 mr-2" />
            Confirmer et verrouiller
          </Button>
        </div>

        {/* Schedule list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Chargement...</p>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun créneau programmé. Choisissez vos disponibilités ci-dessus.
          </p>
        ) : (
          <div className="space-y-2">
            {schedules.map((schedule: any) => (
              <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(schedule.scheduledDate).toLocaleDateString("fr-FR", {
                        weekday: "long", day: "numeric", month: "long"
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">{schedule.timeSlot}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {schedule.isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                  {getStatusBadge(schedule.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseScheduleManager;
