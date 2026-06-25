"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { supabase } from "../../../lib/supabase";
import { 
  Brain, 
  Plus, 
  Save, 
  Trash2, 
  Search, 
  X, 
  ChevronRight, 
  Edit2, 
  Loader2, 
  ExternalLink,
  ChevronLeft,
  RefreshCw
} from "lucide-react";

// Define custom node types
const CustomNode = ({ data, selected }: any) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
        selected
          ? "border-teal-400 bg-teal-950/65 text-teal-100 shadow-[0_0_15px_rgba(20,184,166,0.3)] ring-1 ring-teal-400"
          : "border-slate-300/40 bg-[var(--ui-surface-2)] text-[var(--ui-text)] hover:border-teal-400/50"
      }`}
      style={{
        width: "210px",
        backdropFilter: "blur(12px)",
        boxShadow: "var(--ui-shadow-card)",
      }}
    >
      <div className="font-bold text-xs mb-1 border-b border-teal-500/10 pb-1 flex items-center justify-between">
        <span className="truncate pr-1">{data.label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${selected ? "bg-teal-400 animate-pulse" : "bg-teal-500/40"}`}></span>
      </div>
      <div className="text-[10px] text-[var(--ui-muted)] line-clamp-2 leading-normal">
        {data.description}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#14b8a6", border: "none", width: "7px", height: "7px" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#14b8a6", border: "none", width: "7px", height: "7px" }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

interface RawNode {
  id: string;
  label: string;
  parentId: string | null;
  description: string;
}

interface SavedMindMap {
  id: string;
  title: string;
  topic: string;
  nodes: any[];
  edges: any[];
  created_at: string;
  updated_at: string;
}

// Spacing layout algorithm for the hierarchical tree representation
function computeLayout(rawNodes: RawNode[]) {
  if (rawNodes.length === 0) return [];

  const nodeMap = new Map<string, RawNode & { children: string[] }>();
  rawNodes.forEach((n) => {
    nodeMap.set(n.id, { ...n, children: [] });
  });

  const roots: string[] = [];
  rawNodes.forEach((n) => {
    if (n.parentId && nodeMap.has(n.parentId)) {
      nodeMap.get(n.parentId)!.children.push(n.id);
    } else {
      roots.push(n.id);
    }
  });

  if (roots.length === 0 && rawNodes.length > 0) {
    roots.push(rawNodes[0].id);
  }

  const levels: Record<number, string[]> = {};

  function traverse(id: string, depth: number) {
    if (!levels[depth]) levels[depth] = [];
    if (!levels[depth].includes(id)) {
      levels[depth].push(id);
    }
    const node = nodeMap.get(id);
    if (node) {
      node.children.forEach((childId) => traverse(childId, depth + 1));
    }
  }

  roots.forEach((rootId) => traverse(rootId, 0));

  const resultNodes: any[] = [];
  const spacingX = 240;
  const spacingY = 140;
  const centerX = 400;

  Object.entries(levels).forEach(([depthStr, ids]) => {
    const depth = parseInt(depthStr, 10);
    const count = ids.length;
    ids.forEach((id, index) => {
      const node = nodeMap.get(id)!;
      // Center horizontally on each layer
      const x = centerX + (index - (count - 1) / 2) * spacingX;
      const y = 50 + depth * spacingY;

      resultNodes.push({
        id: node.id,
        type: "custom",
        data: { label: node.label, description: node.description },
        position: { x, y },
      });
    });
  });

  return resultNodes;
}

export default function MindMapsPage() {
  const [savedMaps, setSavedMaps] = useState<SavedMindMap[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("New Mind Map");
  const [topic, setTopic] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [mapInput, setMapInput] = useState("");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [loadingList, setLoadingList] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load Saved Maps from Supabase
  const loadSavedMaps = async (selectFirstId: string | null = null) => {
    setLoadingList(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const { data, error: queryErr } = await supabase
        .from("mind_maps")
        .select("*")
        .order("updated_at", { ascending: false });

      if (queryErr) throw queryErr;

      const maps = (data ?? []).map((m: any) => ({
        id: m.id,
        title: m.title,
        topic: m.topic,
        nodes: Array.isArray(m.nodes) ? m.nodes : [],
        edges: Array.isArray(m.edges) ? m.edges : [],
        created_at: m.created_at,
        updated_at: m.updated_at,
      }));

      setSavedMaps(maps);

      if (selectFirstId) {
        const found = maps.find((m) => m.id === selectFirstId);
        if (found) {
          selectMap(found);
        }
      } else if (maps.length > 0 && !selectedMapId) {
        selectMap(maps[0]);
      }
    } catch (e: any) {
      console.error("Failed to load mind maps:", e);
      setError(e.message || "Failed to load saved mind maps.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadSavedMaps();
  }, []);

  // Filter Saved Maps
  const filteredMaps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return savedMaps;
    return savedMaps.filter(
      (m) =>
        m.title.toLowerCase().includes(q) || m.topic.toLowerCase().includes(q)
    );
  }, [savedMaps, searchQuery]);

  // Select a map to render
  const selectMap = (map: SavedMindMap) => {
    setSelectedMapId(map.id);
    setTitle(map.title);
    setTopic(map.topic);
    setNodes(map.nodes);
    setEdges(map.edges);
    setSelectedNodeData(null);
  };

  // Core generation logic that can be reused
  const generateMindMap = async (queryTopic: string) => {
    setGenerating(true);
    setError(null);
    setSelectedNodeData(null);

    try {
      const res = await fetch("/api/mindmap-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: queryTopic }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate concept map.");
      }

      const data = await res.json();
      
      const newTitle = data.title || `${queryTopic} Mind Map`;
      const generatedNodes = data.nodes || [];

      // Run auto layout algorithm to position nodes
      const positionedNodes = computeLayout(generatedNodes);

      // Create edges automatically from node parentIds
      const calculatedEdges = generatedNodes
        .filter((n: RawNode) => n.parentId)
        .map((n: RawNode) => ({
          id: `e-${n.parentId}-${n.id}`,
          source: n.parentId,
          target: n.id,
          animated: true,
          style: { stroke: "#14b8a6", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#14b8a6",
          },
        }));

      // Update states
      setTitle(newTitle);
      setTopic(queryTopic);
      setSelectedMapId(null); // Unsaved
      setNodes(positionedNodes);
      setEdges(calculatedEdges);
      setMapInput("");
      flashSuccess("Visual Mind Map generated successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during generation.");
    } finally {
      setGenerating(false);
    }
  };

  // Generate a completely new mind map using LLM
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryTopic = mapInput.trim();
    if (!queryTopic) return;
    await generateMindMap(queryTopic);
  };

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNodeData(node.data);
  }, []);

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  // Save the current Mind Map to Supabase
  const handleSave = async () => {
    if (nodes.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("You must be logged in to save.");

      const payload = {
        user_id: u.user.id,
        title: title.trim() || "Untitled Mind Map",
        topic: topic || "General Topic",
        nodes,
        edges,
        updated_at: new Date().toISOString(),
      };

      if (selectedMapId) {
        // Update existing row
        const { error: saveErr } = await supabase
          .from("mind_maps")
          .update(payload)
          .eq("id", selectedMapId);

        if (saveErr) throw saveErr;
        flashSuccess("Mind Map updated successfully!");
        await loadSavedMaps(selectedMapId);
      } else {
        // Create new row
        const { data, error: insertErr } = await supabase
          .from("mind_maps")
          .insert(payload)
          .select("id")
          .single();

        if (insertErr) throw insertErr;
        flashSuccess("Mind Map saved successfully!");
        await loadSavedMaps(data.id);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to save the mind map.");
    } finally {
      setSaving(false);
    }
  };

  // Delete the current Mind Map
  const handleDelete = async () => {
    if (!selectedMapId) {
      // If unsaved, just clear canvas
      setNodes([]);
      setEdges([]);
      setTitle("New Mind Map");
      setTopic("");
      setSelectedNodeData(null);
      return;
    }

    if (!confirm("Are you sure you want to delete this mind map?")) return;

    setSaving(true);
    setError(null);

    try {
      const { error: delErr } = await supabase
        .from("mind_maps")
        .delete()
        .eq("id", selectedMapId);

      if (delErr) throw delErr;

      flashSuccess("Mind Map deleted.");
      setNodes([]);
      setEdges([]);
      setTitle("New Mind Map");
      setTopic("");
      setSelectedMapId(null);
      setSelectedNodeData(null);
      await loadSavedMaps();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to delete the mind map.");
    } finally {
      setSaving(false);
    }
  };

  // Deep Dive: Generate a map for a clicked node's title
  const handleDeepDive = async (subtopicName: string) => {
    if (!subtopicName || !subtopicName.trim()) return;
    await generateMindMap(subtopicName.trim());
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden" style={{ background: "var(--ui-bg)" }}>
      {/* LEFT SIDEBAR: Saved Maps list */}
      <aside
        className={`w-72 border-r border-[var(--ui-border)] flex flex-col transition-all duration-300 ease-in-out bg-[var(--ui-surface)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-72 w-0 overflow-hidden"
        }`}
      >
        <div className="p-4 border-b border-[var(--ui-border)] flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--ui-heading)" }}>
            <Brain className="w-4 h-4 text-teal-400" />
            <span>Saved Concept Maps</span>
          </div>
          <button
            onClick={() => {
              setSelectedMapId(null);
              setTitle("New Mind Map");
              setTopic("");
              setNodes([]);
              setEdges([]);
              setSelectedNodeData(null);
            }}
            className="p-1.5 rounded-lg text-teal-400 hover:bg-[var(--ui-hover)] transition-all duration-150"
            title="Create New Blank Canvas"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search saved maps */}
        <div className="p-3">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-[var(--ui-muted)]" />
            <input
              type="text"
              placeholder="Search maps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-2)] outline-none focus:border-teal-400"
            />
          </div>
        </div>

        {/* Map Items List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1.5 pb-4">
          {loadingList ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--ui-muted)] gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
              <span className="text-[11px]">Loading maps...</span>
            </div>
          ) : filteredMaps.length === 0 ? (
            <div className="text-center py-12 px-4 text-[var(--ui-muted)]">
              <p className="text-xs font-medium">No mind maps yet</p>
              <p className="text-[10px] mt-1">Generate a map to visualize your learning.</p>
            </div>
          ) : (
            filteredMaps.map((m) => {
              const isActive = m.id === selectedMapId;
              return (
                <div
                  key={m.id}
                  onClick={() => selectMap(m)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all duration-150 border ${
                    isActive
                      ? "border-teal-500/30 bg-teal-500/5 text-teal-100"
                      : "border-transparent hover:bg-[var(--ui-hover)] text-[var(--ui-text)]"
                  }`}
                >
                  <p className="text-xs font-semibold truncate" style={{ color: isActive ? "#2dd4bf" : "var(--ui-heading)" }}>
                    {m.title}
                  </p>
                  <p className="text-[10px] text-[var(--ui-muted)] mt-1 truncate">
                    Topic: {m.topic}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* COLLAPSIBLE SIDEBAR TOGGLE BUTTON */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="z-10 flex items-center justify-center w-5 h-12 self-center bg-[var(--ui-surface)] border border-l-0 border-[var(--ui-border)] rounded-r-lg hover:text-teal-400 transition-colors shadow-md"
        title={sidebarOpen ? "Hide Saved Maps" : "Show Saved Maps"}
      >
        {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* CENTER STAGE: Canvas and Generator form */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* Alerts banner */}
        {(error || success) && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
            {error && (
              <div className="rounded-xl px-4 py-2.5 text-xs font-medium shadow-lg border border-red-500/30 bg-red-950/60 text-red-200 backdrop-blur-md">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl px-4 py-2.5 text-xs font-medium shadow-lg border border-teal-500/30 bg-teal-950/60 text-teal-200 backdrop-blur-md">
                {success}
              </div>
            )}
          </div>
        )}

        {/* MAP HEADER */}
        <header className="p-4 border-b border-[var(--ui-border)] flex items-center justify-between gap-4 bg-[var(--ui-surface)] z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingTitle(false);
                }}
                autoFocus
                className="text-sm font-bold border border-teal-400 bg-[var(--ui-surface-2)] rounded px-2 py-0.5 outline-none"
              />
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold truncate max-w-xs sm:max-w-md" style={{ color: "var(--ui-heading)" }}>
                  {title}
                </h2>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 rounded text-[var(--ui-muted)] hover:text-teal-400"
                  title="Rename Mind Map"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
            {topic && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 font-semibold truncate max-w-[120px]">
                {topic}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || nodes.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border border-teal-500/20 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{selectedMapId ? "Save Changes" : "Save Map"}</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={saving || (nodes.length === 0 && !selectedMapId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </header>

        {/* CANVAS AREA */}
        <div className="flex-1 relative bg-slate-950/5 select-none">
          {generating && (
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4 text-slate-100">
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
                <Brain className="w-5 h-5 text-teal-400 absolute animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">Creating Your Visual Concept Map...</p>
                <p className="text-xs text-slate-400">EduFlow AI is organizing subtopics and relationships</p>
              </div>
            </div>
          )}

          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/5">
                <Brain className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-base font-bold mb-1.5" style={{ color: "var(--ui-heading)" }}>
                Start Visualizing Complex Topics
              </h3>
              <p className="text-xs text-[var(--ui-muted)] max-w-sm mb-6">
                Enter any subject (e.g. "Artificial Intelligence", "Organic Chemistry", "World War II") below to generate an interactive, zoomable mind map.
              </p>

              <form id="gen-form" onSubmit={handleGenerate} className="w-full max-w-md flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter a study topic..."
                  value={mapInput}
                  onChange={(e) => setMapInput(e.target.value)}
                  disabled={generating}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] text-xs outline-none focus:border-teal-400 shadow-sm"
                />
                <button
                  type="submit"
                  disabled={generating || !mapInput.trim()}
                  className="btn-primary text-xs px-4 py-2.5 disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  Generate
                </button>
              </form>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
              maxZoom={1.5}
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: "#14b8a6", strokeWidth: 2 }
              }}
            >
              <Background color="rgba(20, 184, 166, 0.12)" gap={16} size={1} />
              <Controls className="!bg-[var(--ui-surface)] !border-[var(--ui-border)] !shadow-lg [&>button]:!border-b [&>button]:!border-[var(--ui-border)] [&>button]:!bg-[var(--ui-surface)] [&>button>svg]:!fill-teal-400 hover:[&>button]:!bg-[var(--ui-hover)]" />
              <MiniMap 
                nodeColor={() => "#14b8a6"} 
                maskColor="rgba(11, 18, 32, 0.4)"
                className="!bg-[var(--ui-surface)] !border-[var(--ui-border)] !rounded-xl overflow-hidden shadow-lg border hidden sm:block" 
              />

              {/* FLOATING GENERATOR INPUT */}
              <Panel position="top-center" className="w-[90%] max-w-md mt-2">
                <form onSubmit={handleGenerate} className="flex items-center gap-2 p-1.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/90 backdrop-blur-md shadow-xl">
                  <input
                    type="text"
                    placeholder="Visualize a new topic..."
                    value={mapInput}
                    onChange={(e) => setMapInput(e.target.value)}
                    disabled={generating}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-2)] text-xs outline-none focus:border-teal-400"
                  />
                  <button
                    type="submit"
                    disabled={generating || !mapInput.trim()}
                    className="inline-flex items-center justify-center p-2 rounded-lg bg-gradient-to-r from-teal-400 to-teal-500 hover:brightness-105 transition-all text-slate-900 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </Panel>
            </ReactFlow>
          )}
        </div>
      </main>

      {/* INSPECTOR PANEL (Right side): Clicked Node Explanation */}
      <aside
        className={`w-80 border-l border-[var(--ui-border)] flex flex-col transition-all duration-300 ease-in-out bg-[var(--ui-surface)] ${
          selectedNodeData ? "translate-x-0" : "translate-x-80 w-0 overflow-hidden"
        }`}
      >
        {selectedNodeData && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-[var(--ui-border)] flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-widest text-[var(--ui-muted)]">
                Concept Inspector
              </span>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="p-1 rounded-lg hover:bg-[var(--ui-hover)] text-[var(--ui-muted)] hover:text-teal-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-teal-400">
                  {selectedNodeData.label}
                </h3>
                <div className="h-[2px] bg-gradient-to-r from-teal-500/35 to-transparent w-24"></div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-[var(--ui-muted)]">
                  Brief Explanation
                </h4>
                <p className="text-xs text-[var(--ui-text)] leading-relaxed bg-[var(--ui-surface-2)] p-4 rounded-xl border border-[var(--ui-border)]">
                  {selectedNodeData.description}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[var(--ui-border)]">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-[var(--ui-muted)]">
                  Interactive Learning
                </h4>
                <button
                  onClick={() => handleDeepDive(selectedNodeData.label)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 text-teal-400 font-semibold text-xs transition-all duration-150"
                >
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Deep-Dive Subtopic
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--ui-border)] text-[9px] text-[var(--ui-muted)] text-center">
              Selected concept is part of the <span className="text-teal-500">{topic}</span> mind map.
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
