import { ReactNode } from "react";
import { CheckCircle, Lock, ChevronDown, MessageCircle, Radio } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { AppPageHeader } from "@/components/pwa/AppPageHeader";
import type { Module } from "@/pages/CourseLearn";
import type { LucideIcon } from "lucide-react";

interface CourseLearnAppShellProps {
  courseTitle: string;
  modules: Module[];
  activeModuleId: number | null;
  onSelectModule: (id: number) => void;
  progress: number;
  completedCount: number;
  getModuleIcon: (type: string) => LucideIcon;
  onBack: () => void;
  showComments: boolean;
  onToggleComments: () => void;
  commentsSlot?: ReactNode;
  showChat: boolean;
  onToggleChat: () => void;
  chatSlot?: ReactNode;
  children: ReactNode;
}

export function CourseLearnAppShell({
  courseTitle, modules, activeModuleId, onSelectModule, progress, completedCount,
  getModuleIcon, onBack, showComments, onToggleComments, commentsSlot, showChat, onToggleChat, chatSlot, children,
}: CourseLearnAppShellProps) {
  const activeIndex = modules.findIndex((m) => m.id === activeModuleId);
  const currentModule = modules[activeIndex];

  return (
    <div className="pb-10">
      <AppPageHeader
        title={courseTitle}
        onBack={onBack}
        right={<span className="text-xs font-bold text-primary tabular-nums">{Math.round(progress)}%</span>}
      >
        <div className="px-4 pb-3 space-y-2">
          <Progress value={progress} className="h-1.5" />
          <Drawer>
            <DrawerTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-left"
              >
                <span className="text-xs font-bold text-muted-foreground shrink-0">
                  {activeIndex + 1}/{modules.length}
                </span>
                <span className="text-sm font-semibold truncate flex-1">{currentModule?.title}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
              <DrawerHeader className="text-left">
                <DrawerTitle>Sommaire</DrawerTitle>
                <p className="text-sm text-muted-foreground">{completedCount}/{modules.length} modules complétés</p>
              </DrawerHeader>
              <div className="px-4 pb-8 overflow-y-auto space-y-1.5">
                {modules.map((mod) => {
                  const Icon = getModuleIcon(mod.type);
                  const isActive = mod.id === activeModuleId;
                  return (
                    <DrawerClose asChild key={mod.id}>
                      <button
                        type="button"
                        onClick={() => !mod.locked && onSelectModule(mod.id)}
                        disabled={mod.locked}
                        className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors ${
                          isActive ? "bg-primary/10 border border-primary/30" : mod.locked ? "opacity-50" : "active:bg-muted"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          mod.completed ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" :
                          isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {mod.completed ? <CheckCircle className="w-4 h-4" /> : mod.locked ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>{mod.title}</p>
                          {mod.locked && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {mod.type === "synthesis_exam" ? "Terminez tous les quiz pour y accéder" : "Terminez le module précédent"}
                            </p>
                          )}
                        </div>
                      </button>
                    </DrawerClose>
                  );
                })}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </AppPageHeader>

      <div className="px-4 pt-4">{children}</div>

      <div className="flex gap-2 px-4 mt-4">
        <button
          type="button"
          onClick={onToggleComments}
          className={`flex-1 h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            showComments ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" /> Discussions
        </button>
        <button
          type="button"
          onClick={onToggleChat}
          className={`flex-1 h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            showChat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> Chat live
        </button>
      </div>

      {showComments && commentsSlot && <div className="px-4 mt-4">{commentsSlot}</div>}
      {showChat && chatSlot && <div className="px-4 mt-4">{chatSlot}</div>}
    </div>
  );
}

export default CourseLearnAppShell;
