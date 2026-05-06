import { type TabId } from "@/pages/analyzer";
import { PipelineStatus } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Moon, Sun, Upload, FileText, AlertCircle, Lightbulb, Edit, SplitSquareHorizontal, CheckCircle2, Loader2, Lock, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  pipelineStatus?: PipelineStatus;
  resumeId: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ activeTab, onChangeTab, pipelineStatus, resumeId, isOpen, onClose }: AppSidebarProps) {
  const { theme, setTheme } = useTheme();

  const tabs: { id: TabId; label: string; icon: React.ReactNode; color: string; statusName: string }[] = [
    { id: "upload", label: "Upload", icon: <Upload className="w-4 h-4" />, color: "text-purple-500", statusName: "upload" },
    { id: "extraction", label: "Extraction", icon: <FileText className="w-4 h-4" />, color: "text-cyan-500", statusName: "extraction" },
    { id: "gaps", label: "Gap Analysis", icon: <AlertCircle className="w-4 h-4" />, color: "text-amber-500", statusName: "gaps" },
    { id: "suggestions", label: "Suggestions", icon: <Lightbulb className="w-4 h-4" />, color: "text-pink-500", statusName: "suggestions" },
    { id: "rewrite", label: "Rewrite", icon: <Edit className="w-4 h-4" />, color: "text-green-500", statusName: "rewrite" },
    { id: "diff", label: "Diff Viewer", icon: <SplitSquareHorizontal className="w-4 h-4" />, color: "text-purple-400", statusName: "diff" },
    { id: "validation", label: "Validation", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-amber-400", statusName: "validation" },
  ];

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 flex items-center justify-between lg:block">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">ResumeLift</h1>
          <button onClick={onClose} className="lg:hidden text-muted-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {pipelineStatus?.matchScore && (
          <div className="mx-4 mb-6 p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match Score</span>
              <span className="text-lg font-black text-primary">{pipelineStatus.matchScore}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out" 
                style={{ width: `${pipelineStatus.matchScore}%` }}
              />
            </div>
          </div>
        )}

        <nav className="px-3 space-y-1">
          {tabs.map((tab, index) => {
            const stageStatus = pipelineStatus?.stages?.find(s => s.name === tab.statusName);
            const status = stageStatus?.status || (resumeId && index > 0 ? "pending" : "idle");
            const isLocked = !resumeId && index > 0;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (!isLocked) {
                    onChangeTab(tab.id);
                    onClose?.();
                  }
                }}
                disabled={isLocked}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isLocked && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className={cn(activeTab === tab.id ? tab.color : "text-muted-foreground/60")}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                
                {status === "complete" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {status === "running" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {isLocked && <Lock className="w-3 h-3 opacity-50" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:bg-accent rounded-xl"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <><Sun className="w-4 h-4 mr-2" /> Light Mode</>
          ) : (
            <><Moon className="w-4 h-4 mr-2" /> Dark Mode</>
          )}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-border bg-card flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}