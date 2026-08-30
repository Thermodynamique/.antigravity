"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, FileCode2, FolderOpen, MoreHorizontal, X, Code, FileText, Sparkles } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import { useVceCodeIngest } from "@/hooks/useVceCodeIngest";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const DEMO_FILES = [
  {
    name: "main.py",
    path: "src/main.py",
    language: "python",
    content: `import os\nfrom fastapi import FastAPI, HTTPException\nfrom stripe_client import process_payment\n\napp = FastAPI(title="Nightcode API Engine")\n\n@app.get("/health")\ndef health_check():\n    return {"status": "healthy", "service": "nightcode-mcp"}\n\n@app.post("/checkout")\ndef checkout(amount: int, currency: str = "usd"):\n    try:\n        res = process_payment(amount, currency)\n        return {"status": "success", "charge_id": res["id"]}\n    except Exception as e:\n        raise HTTPException(status_code=400, detail=str(e))\n`
  },
  {
    name: "stripe_client.py",
    path: "src/stripe_client.py",
    language: "python",
    content: `import os\nimport stripe\n\nstripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "sk_test_mock")\n\ndef process_payment(amount_cents: int, currency: str = "usd"):\n    """Effectue un paiement sécurisé via l'API Stripe."""\n    if amount_cents <= 0:\n        raise ValueError("Le montant doit être supérieur à zero")\n    \n    charge = stripe.Charge.create(\n        amount=amount_cents,\n        currency=currency,\n        description="Nightcode Spatial License",\n        source="tok_visa"\n    )\n    return charge\n`
  },
  {
    name: "webhook.py",
    path: "src/webhook.py",
    language: "python",
    content: `from fastapi import Request, Header, HTTPException\nimport stripe\n\nasync def stripe_webhook(request: Request, stripe_signature: str = Header(None)):\n    payload = await request.body()\n    try:\n        event = stripe.Webhook.construct_event(\n            payload, stripe_signature, "whsec_mock_secret"\n        )\n    except Exception as e:\n        raise HTTPException(status_code=400, detail=f"Webhook Error: {str(e)}")\n        \n    if event['type'] == 'payment_intent.succeeded':\n        payment_intent = event['data']['object']\n        print(f"Paiement réussi pour {payment_intent['id']}")\n        \n    return {"status": "success"}\n`
  },
  {
    name: "test_api.py",
    path: "tests/test_api.py",
    language: "python",
    content: `import pytest\nfrom src.stripe_client import process_payment\n\ndef test_process_payment_valid():\n    # Test d'assertion basique pour le World Graph VCE\n    assert process_payment is not None\n`
  },
  {
    name: ".env",
    path: ".env",
    language: "plaintext",
    content: `STRIPE_SECRET_KEY=sk_test_nightcode_sample_key_12345\nNEXT_PUBLIC_VCE_API_URL=http://localhost:8766\n`
  }
];

export function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const { nodes, addNode, setActiveDocumentId, setNodes, activeDocumentId } = useCanvas();
  const { ingestCode } = useVceCodeIngest();

  const handleOpenFile = (file: typeof DEMO_FILES[0]) => {
    // Vérifier si le nœud existe déjà sur le Canvas
    const existingNode = nodes.find(
      (n) => n.data?.label === file.name || n.data?.path === file.path
    );

    if (existingNode) {
      setActiveDocumentId(existingNode.id);
      setIsSidebarOpen(false);
      return;
    }

    // Sinon créer un nouveau nœud Monaco Editor
    const newId = `code_node_${Date.now()}`;
    const offset = (nodes.length % 5) * 40;
    const newPosition = { x: 300 + offset, y: 150 + offset };

    const newNode = {
      id: newId,
      position: newPosition,
      data: {
        label: file.name,
        path: file.path,
        isDocument: false,
        category: "code",
        codeContent: file.content,
        language: file.language,
        messages: [],
      },
      type: "custom",
    };

    setNodes((nds) => nds.concat(newNode as any));
    setActiveDocumentId(newId);

    // Déclencher l'ingestion automatique VCE
    ingestCode(newId, file.name, file.content, file.language);
    setIsSidebarOpen(false);
  };

  const handleImportFullProject = () => {
    let currentX = 250;
    let currentY = 150;

    DEMO_FILES.forEach((file, idx) => {
      const existingNode = nodes.find((n) => n.data?.label === file.name);
      const nodeId = existingNode ? existingNode.id : `code_node_${Date.now()}_${idx}`;

      if (!existingNode) {
        const newNode = {
          id: nodeId,
          position: { x: currentX, y: currentY },
          data: {
            label: file.name,
            path: file.path,
            isDocument: false,
            category: "code",
            codeContent: file.content,
            language: file.language,
            messages: [],
          },
          type: "custom",
        };
        addNode(newNode as any);
        currentX += 450;
        if (currentX > 1200) {
          currentX = 250;
          currentY += 350;
        }
      }

      // Déclencher l'ingestion VCE
      ingestCode(nodeId, file.name, file.content, file.language);
    });

    setIsSidebarOpen(false);
  };

  if (!isSidebarOpen) return null;

  // Obtenir le nœud actif pour s'assurer qu'il s'agit bien d'un fichier code
  const activeNode = nodes.find(n => n.id === activeDocumentId);
  const isCodeActive = activeNode && !activeNode.data?.isDocument;

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 w-80 bg-[#0d0e14]/90 backdrop-blur-2xl border-r border-white/10 z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 animate-in slide-in-from-left"
    )}>
      {/* HEADER */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-white/10 text-xs font-semibold text-neutral-300 uppercase tracking-wider shrink-0 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white tracking-wide">Explorateur VCE</span>
        </div>
        <div className="flex items-center gap-1">
          <label
            className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
            title="Importer des fichiers réels de votre projet"
          >
            <FolderOpen className="w-3 h-3 text-blue-400" />
            Importer Fichiers
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                Array.from(files).forEach((file, idx) => {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const content = ev.target?.result as string;
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    const newId = `code_user_${Date.now()}_${idx}`;
                    const offset = (nodes.length % 5) * 40;
                    const newPosition = { x: 300 + offset, y: 150 + offset };
                    const newNode = {
                      id: newId,
                      position: newPosition,
                      data: {
                        label: file.name,
                        path: file.name,
                        isDocument: false,
                        category: "code",
                        codeContent: content,
                        language: ext === 'py' ? 'python' : ext === 'ts' || ext === 'tsx' ? 'typescript' : ext === 'js' || ext === 'jsx' ? 'javascript' : ext === 'css' ? 'css' : ext === 'html' ? 'html' : ext === 'json' ? 'json' : 'plaintext',
                        messages: [],
                      },
                      type: "custom",
                    };
                    setNodes((nds) => nds.concat(newNode as any));
                    setActiveDocumentId(newId);
                    ingestCode(newId, file.name, content, ext || 'txt');
                  };
                  reader.readAsText(file);
                });
                setIsSidebarOpen(false);
              }}
            />
          </label>
          <button
            onClick={handleImportFullProject}
            className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
            title="Importer tout le projet démo VCE"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            Démo
          </button>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
            title="Fermer la barre latérale"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FILE TREE */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 custom-scrollbar text-xs font-mono text-neutral-300">
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-purple-400 font-bold uppercase tracking-widest text-[10px]">
          <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>Handy IA Workspace</span>
        </div>

        <div className="pl-3 space-y-0.5">
          <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-400">
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            <FolderOpen className="w-3.5 h-3.5 text-yellow-500/80" />
            <span>src</span>
          </div>

          <div className="pl-5 space-y-1">
            {DEMO_FILES.filter((f) => f.path.startsWith("src/")).map((file) => (
              <button
                key={file.path}
                onClick={() => handleOpenFile(file)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-purple-950/30 hover:border-purple-500/30 border border-transparent rounded-md text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-blue-400 group-hover:text-purple-400 transition-colors" />
                  <span className="font-medium text-neutral-200 group-hover:text-white">
                    {file.name}
                  </span>
                </div>
                <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 text-purple-400 transition-opacity" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-400 mt-2">
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            <FolderOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span>tests</span>
          </div>

          <div className="pl-5">
            {DEMO_FILES.filter((f) => f.path.startsWith("tests/")).map((file) => (
              <button
                key={file.path}
                onClick={() => handleOpenFile(file)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-purple-950/30 hover:border-purple-500/30 border border-transparent rounded-md text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-green-400 group-hover:text-purple-400 transition-colors" />
                  <span className="font-medium text-neutral-200 group-hover:text-white">
                    {file.name}
                  </span>
                </div>
                <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 text-purple-400 transition-opacity" />
              </button>
            ))}
          </div>

          <div className="pt-2">
            {DEMO_FILES.filter((f) => !f.path.includes("/")).map((file) => (
              <button
                key={file.path}
                onClick={() => handleOpenFile(file)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-purple-950/30 hover:border-purple-500/30 border border-transparent rounded-md text-left transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
                  <span className="font-medium text-neutral-300 group-hover:text-white">
                    {file.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-neutral-800 bg-[#121212] text-[11px] text-neutral-500 font-mono">
        Cliquez sur un fichier pour l'ouvrir dans l'éditeur Monaco sur le Canvas.
      </div>
    </aside>
  );
}
