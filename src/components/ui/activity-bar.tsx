"use client";

import { Files, Search, GitBranch, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityBarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function ActivityBar({ isSidebarOpen = true, onToggleSidebar }: ActivityBarProps) {
  return (
    <div className="w-12 h-full bg-[#181818] border-r border-[#2b2b2b] flex flex-col items-center py-3 shrink-0 z-50">
      <div className="flex flex-col gap-1 w-full items-center">
        {/* Bouton Fichiers (Explorateur VCE) — seul bouton fonctionnel */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Fermer l'Explorateur" : "Explorateur de fichiers"}
          className={cn(
            "relative p-2.5 transition-colors w-full flex justify-center group",
            isSidebarOpen ? "text-white" : "text-neutral-500 hover:text-white"
          )}
        >
          <Files className="w-5 h-5" />
          {isSidebarOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-7 bg-white rounded-r-full" />
          )}
        </button>

        {/* Bouton Recherche — placeholder visuel discret */}
        <button
          className="p-2.5 text-neutral-600 hover:text-neutral-400 transition-colors w-full flex justify-center"
          title="Recherche (bientôt disponible)"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Bouton Git — placeholder visuel discret */}
        <button
          className="p-2.5 text-neutral-600 hover:text-neutral-400 transition-colors w-full flex justify-center"
          title="Contrôle de version (bientôt disponible)"
        >
          <GitBranch className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
