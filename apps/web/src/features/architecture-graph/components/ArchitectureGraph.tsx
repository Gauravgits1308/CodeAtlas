import * as React from "react";
import { 
  Maximize2, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Folder, 
  FileCode, 
  Database, 
  Cpu, 
  Key, 
  X, 
  ExternalLink,
  Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

interface ArchitectureGraphProps {
  filesTree: FileTreeNode[];
  onSelectFile: (filePath: string) => void;
  repoName: string;
}

interface GraphNode {
  id: string;
  name: string;
  type: "folder" | "file" | "component" | "route" | "database" | "service" | "controller" | "middleware" | "worker" | "utility" | "dependency" | "entrypoint";
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed?: boolean;
  visible?: boolean;
  parentId?: string | null;
  metadata: {
    linesOfCode: number;
    purpose: string;
    exports: string[];
    imports: string[];
    dependencies: string[];
    dependents: string[];
  };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export function ArchitectureGraph({ filesTree, onSelectFile, repoName }: ArchitectureGraphProps) {
  // SVG Canvas States
  const [pan, setPan] = React.useState({ x: 80, y: 60 });
  const [zoom, setZoom] = React.useState(0.9);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  // UI Interactive States
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = React.useState<Record<string, boolean>>({});
  
  // Filter States
  const [filters, setFilters] = React.useState({
    folders: true,
    entrypoints: true,
    routes: true,
    components: true,
    services: true,
    database: true,
    utilities: true,
    workers: true,
    dependencies: true,
  });

  const [nodeOffsets, setNodeOffsets] = React.useState<Record<string, { x: number; y: number }>>({});

  // Traverse fileTree and generate nodes and edges
  const { nodes: baseNodes, edges } = React.useMemo(() => {
    const parsedNodes: GraphNode[] = [];
    const parsedEdges: GraphEdge[] = [];

    const classifyType = (name: string, path: string): GraphNode["type"] => {
      const ext = name.split(".").pop()?.toLowerCase();
      const lowerPath = path.toLowerCase();

      if (name === "package.json") return "dependency";
      if (name.endsWith("schema.prisma") || lowerPath.includes("database") || lowerPath.includes("db.ts") || lowerPath.includes("prisma")) return "database";
      if (lowerPath.includes("worker") || name.includes(".worker.")) return "worker";
      if (lowerPath.includes("middleware") || name.includes(".middleware.")) return "middleware";
      if (lowerPath.includes("controller") || name.includes(".controller.")) return "controller";
      if (lowerPath.includes("service") || name.includes(".service.")) return "service";
      if (lowerPath.includes("route") || lowerPath.includes("routes")) return "route";
      if (lowerPath.includes("utils") || lowerPath.includes("helpers")) return "utility";
      
      if (["index.ts", "main.ts", "app.ts", "server.ts", "layout.tsx"].includes(name.toLowerCase())) {
        return "entrypoint";
      }
      
      if (ext === "tsx" || (ext === "jsx" && name[0] === name[0].toUpperCase())) {
        return "component";
      }

      return "file";
    };

    const getPurposeString = (type: GraphNode["type"], name: string) => {
      switch (type) {
        case "entrypoint": return "Application gateway listener bootstrapper.";
        case "dependency": return "Project packages configuration.";
        case "database": return "Prisma schema model representation.";
        case "route": return "REST endpoints routing layer.";
        case "controller": return "HTTP request handling gateway controller.";
        case "service": return "Business logic execution flow module.";
        case "middleware": return "OAuth security filters authentication.";
        case "worker": return "Asynchronous BullMQ task executor worker.";
        case "component": return "User Interface rendering view component.";
        case "utility": return "Helper common module libraries.";
        case "folder": return "Directory hierarchy container.";
        default: return `Source file logic definition for ${name}.`;
      }
    };

    // Traverse directory tree to populate parsedNodes
    const traverse = (node: FileTreeNode, parentId: string | null = null) => {
      const isDir = node.type === "directory";
      const type = isDir ? "folder" : classifyType(node.name, node.path);
      const id = node.path;

      // Estimate mockup metrics details
      const linesOfCode = isDir ? 0 : Math.round(15 + (node.name.length * 4.5));
      const purpose = getPurposeString(type, node.name);
      
      parsedNodes.push({
        id,
        name: node.name,
        type,
        path: node.path,
        x: 0,
        y: 0,
        width: 170,
        height: 48,
        parentId,
        metadata: {
          linesOfCode,
          purpose,
          exports: isDir ? [] : ["default", "handler"],
          imports: isDir ? [] : ["api", "db", "logger"],
          dependencies: [],
          dependents: []
        }
      });

      if (parentId) {
        parsedEdges.push({
          id: `${parentId}-${id}`,
          source: parentId,
          target: id
        });
      }

      if (isDir && node.children) {
        node.children.forEach(child => traverse(child, id));
      }
    };

    filesTree.forEach(node => traverse(node));

    // Dynamic relational link edges between layers (Service-to-DB, Controller-to-Service, etc.)
    const services = parsedNodes.filter(n => n.type === "service");
    const controllers = parsedNodes.filter(n => n.type === "controller");
    const routes = parsedNodes.filter(n => n.type === "route");
    const dbLayer = parsedNodes.filter(n => n.type === "database");

    // Route -> Controller links
    routes.forEach(route => {
      const match = controllers.find(ctrl => ctrl.name.replace(".controller.", "").replace(".ts", "") === route.name.replace(".routes.", "").replace(".ts", ""));
      if (match) {
        parsedEdges.push({
          id: `rel-${route.id}-${match.id}`,
          source: route.id,
          target: match.id
        });
      }
    });

    // Controller -> Service links
    controllers.forEach(ctrl => {
      const match = services.find(srv => srv.name.replace(".service.", "").replace(".ts", "") === ctrl.name.replace(".controller.", "").replace(".ts", ""));
      if (match) {
        parsedEdges.push({
          id: `rel-${ctrl.id}-${match.id}`,
          source: ctrl.id,
          target: match.id
        });
      }
    });

    // Service -> Database links
    services.forEach(srv => {
      dbLayer.forEach(db => {
        parsedEdges.push({
          id: `rel-${srv.id}-${db.id}`,
          source: srv.id,
          target: db.id
        });
      });
    });

    // Assign dependencies lists based on edges
    parsedNodes.forEach(node => {
      const deps = parsedEdges.filter(e => e.source === node.id).map(e => e.target);
      const dependents = parsedEdges.filter(e => e.target === node.id).map(e => e.source);
      node.metadata.dependencies = deps;
      node.metadata.dependents = dependents;
    });

    // Automated layout positioning by columns / architectural layers
    const getColumnForType = (type: GraphNode["type"]): number => {
      switch (type) {
        case "entrypoint": return 0;
        case "dependency": return 0;
        case "folder": return 1;
        case "middleware": return 2;
        case "route": return 2;
        case "controller": return 3;
        case "component": return 3;
        case "service": return 4;
        case "utility": return 4;
        case "worker": return 4;
        case "database": return 5;
        default: return 1; // general files inside column 1
      }
    };

    // Distribute into layers
    const columns: Record<number, GraphNode[]> = {};
    parsedNodes.forEach(node => {
      const col = getColumnForType(node.type);
      if (!columns[col]) columns[col] = [];
      columns[col].push(node);
    });

    // Compute coordinates with custom vertical alignments
    const colWidth = 240;
    const rowHeight = 75;

    Object.keys(columns).forEach(colKey => {
      const col = parseInt(colKey);
      const nodesInCol = columns[col];
      const startY = 100 - (nodesInCol.length * rowHeight) / 2;

      nodesInCol.forEach((node, rowIdx) => {
        node.x = col * colWidth;
        node.y = startY + rowIdx * rowHeight + 350; // offset vertically
      });
    });

    return { nodes: parsedNodes, edges: parsedEdges };
  }, [filesTree]);

  const nodes = React.useMemo(() => {
    return baseNodes.map(node => {
      const offset = nodeOffsets[node.id] || { x: 0, y: 0 };
      return {
        ...node,
        x: node.x + offset.x,
        y: node.y + offset.y,
      };
    });
  }, [baseNodes, nodeOffsets]);

  // Compute active filters
  const getVisibleNodes = React.useCallback(() => {
    return nodes.filter(node => {
      // Search query filtering
      if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Collapsed folders check
      if (node.parentId) {
        let parent: GraphNode | undefined = nodes.find(n => n.id === node.parentId);
        while (parent) {
          if (collapsedFolders[parent.id]) return false;
          const pid = parent.parentId;
          parent = pid ? nodes.find(n => n.id === pid) : undefined;
        }
      }

      // Checkbox filters
      if (node.type === "folder" && !filters.folders) return false;
      if (node.type === "entrypoint" && !filters.entrypoints) return false;
      if (node.type === "route" && !filters.routes) return false;
      if (node.type === "component" && !filters.components) return false;
      if (node.type === "service" && !filters.services) return false;
      if (node.type === "database" && !filters.database) return false;
      if (node.type === "utility" && !filters.utilities) return false;
      if (node.type === "worker" && !filters.workers) return false;
      if (node.type === "dependency" && !filters.dependencies) return false;

      return true;
    });
  }, [nodes, collapsedFolders, filters, searchQuery]);

  const visibleNodes = getVisibleNodes();
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const activeEdges = edges.filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));

  // Graph Controls handlers
  const handleZoom = (direction: "in" | "out") => {
    setZoom(prev => {
      const step = direction === "in" ? 0.1 : -0.1;
      return Math.max(0.3, Math.min(2.0, prev + step));
    });
  };

  const handleCenter = () => {
    setPan({ x: 80, y: 60 });
    setZoom(0.9);
  };

  // Node Drag handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDraggedNodeId(nodeId);
    setDragOffset({
      x: e.clientX / zoom - node.x,
      y: e.clientY / zoom - node.y,
    });
  };

  // Canvas Panning handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (draggedNodeId) return;
    setIsPanning(true);
    setPanStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      // Update dragged node position offset
      const baseNode = baseNodes.find(n => n.id === draggedNodeId);
      if (baseNode) {
        const newX = e.clientX / zoom - dragOffset.x;
        const newY = e.clientY / zoom - dragOffset.y;
        setNodeOffsets(prev => ({
          ...prev,
          [draggedNodeId]: {
            x: newX - baseNode.x,
            y: newY - baseNode.y,
          }
        }));
      }
      return;
    }

    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleCanvasMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  // Expand/Collapse Toggler
  const toggleFolderCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedFolders(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Get Node details
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Helper icons selector
  const getNodeIcon = (type: GraphNode["type"]) => {
    const size = 14;
    switch (type) {
      case "folder": return <Folder size={size} className="text-amber-400" />;
      case "database": return <Database size={size} className="text-blue-400" />;
      case "worker": return <Cpu size={size} className="text-emerald-400" />;
      case "middleware": return <Key size={size} className="text-pink-400" />;
      case "entrypoint": return <Maximize2 size={size} className="text-violet-400" />;
      default: return <FileCode size={size} className="text-muted-foreground" />;
    }
  };

  // Node styles
  const getNodeBorderColor = (type: GraphNode["type"], isSelected: boolean) => {
    if (isSelected) return "border-primary shadow-[0_0_12px_rgba(59,130,246,0.25)]";
    switch (type) {
      case "folder": return "border-amber-500/20 hover:border-amber-500/50";
      case "database": return "border-blue-500/20 hover:border-blue-500/50";
      case "worker": return "border-emerald-500/20 hover:border-emerald-500/50";
      case "middleware": return "border-pink-500/20 hover:border-pink-500/50";
      case "entrypoint": return "border-violet-500/20 hover:border-violet-500/50";
      default: return "border-border/30 hover:border-border/60";
    }
  };

  // AI Architecture Insights
  const aiInsights = React.useMemo(() => {
    const entry = nodes.find(n => n.type === "entrypoint");
    const db = nodes.find(n => n.type === "database");
    const files = nodes.filter(n => n.type !== "folder");
    const servicesCount = nodes.filter(n => n.type === "service").length;

    return [
      `Grounded entry point located at ${entry ? entry.name : "src/index.ts"}.`,
      `Communication flows through ${servicesCount} Worker Services.`,
      `Database context handles connections to ${db ? db.name : "PrismaClient"}.`,
      `Repository map indexes ${files.length} active logical files.`
    ];
  }, [nodes]);

  return (
    <div className="flex-1 flex overflow-hidden bg-[#080B12] text-foreground border border-border/10 rounded-xl relative select-none">
      
      {/* LEFT SIDEBAR: FILTERS & NAVIGATION */}
      <div className="w-56 border-r border-border/10 p-4 bg-[#0A0D15]/80 flex flex-col gap-4 select-none shrink-0">
        <div className="pb-1 border-b border-border/5">
          <span className="text-[10px] font-mono font-bold text-foreground truncate block">{repoName}</span>
        </div>
        <div className="flex items-center gap-1.5 pb-2 border-b border-border/10">
          <SlidersHorizontal size={14} className="text-primary" />
          <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground tracking-wider">Graph Layers</span>
        </div>

        {/* Filter Checkboxes */}
        <div className="space-y-2.5 text-[11px] font-sans">
          {Object.entries(filters).map(([key, val]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={val}
                onChange={() => setFilters(prev => ({ ...prev, [key]: !prev[key as keyof typeof filters] }))}
                className="size-3.5 accent-primary bg-zinc-900 border border-border/20 rounded cursor-pointer"
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>

        {/* Search tool */}
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-full bg-[#111622] border border-border/10 rounded-lg pl-8 pr-2.5 py-1.5 text-[10px] font-mono placeholder:text-muted-foreground/35 outline-none focus:border-primary/50 text-foreground"
          />
        </div>
      </div>

      {/* CENTER WORKSPACE: CANVAS */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top AI Insights Bar */}
        <div className="h-10 border-b border-border/10 bg-[#0A0D15]/40 px-4 flex items-center justify-between shrink-0 select-none overflow-x-auto scrollbar-none gap-4">
          <div className="flex items-center gap-1.5 shrink-0">
            <Sparkles size={13} className="text-primary animate-pulse" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">AI Architecture Insights:</span>
          </div>
          <div className="flex items-center gap-6 divide-x divide-border/5 text-[10px] font-sans text-foreground/80 flex-1 justify-end">
            {aiInsights.map((insight, idx) => (
              <span key={idx} className="pl-6 first:pl-0 font-medium truncate">{insight}</span>
            ))}
          </div>
        </div>

        {/* Dynamic Nodes and Edges Layout Canvas */}
        <div 
          className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden bg-[#070A13] focus:outline-none"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* SVG Elements Layer */}
          <svg className="absolute inset-0 pointer-events-none size-full z-0">
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#1e293b" fillOpacity="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Dynamic Connector Edges */}
              {activeEdges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                // Edge calculations
                const startX = sourceNode.x + sourceNode.width;
                const startY = sourceNode.y + sourceNode.height / 2;
                const endX = targetNode.x;
                const endY = targetNode.y + targetNode.height / 2;

                const midX = (startX + endX) / 2;
                const pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                const isHighlighted = hoveredNodeId === edge.source || hoveredNodeId === edge.target;

                return (
                  <g key={edge.id}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isHighlighted ? "#3b82f6" : "#1e293b"}
                      strokeWidth={isHighlighted ? 2.0 : 1.0}
                      className="transition-all duration-200"
                    />
                    {/* Arrow head */}
                    <polygon
                      points={`${endX},${endY} ${endX - 4},${endY - 3} ${endX - 4},${endY + 3}`}
                      fill={isHighlighted ? "#3b82f6" : "#1e293b"}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Interactive HTML Card Nodes */}
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top left"
            }}
          >
            {visibleNodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isSearching = searchQuery ? node.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (node.type !== "folder") {
                      onSelectFile(node.path);
                    }
                  }}
                  style={{
                    position: "absolute",
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={cn(
                    "pointer-events-auto select-none p-2 rounded-xl bg-[#111625]/90 border text-[11px] font-sans flex items-center justify-between shadow-md transition-all cursor-pointer",
                    getNodeBorderColor(node.type, isSelected),
                    isSearching ? "ring-2 ring-primary/40 animate-pulse" : ""
                  )}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    {getNodeIcon(node.type)}
                    <div className="truncate">
                      <span className="text-foreground font-semibold font-sans block truncate leading-tight">
                        {node.name}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60 font-mono">
                        {node.type}
                      </span>
                    </div>
                  </div>

                  {/* Expand/Collapse Folder Action */}
                  {node.type === "folder" && (
                    <button
                      onClick={(e) => toggleFolderCollapse(node.id, e)}
                      className="p-1 hover:bg-[#1E2538]/60 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                    >
                      {collapsedFolders[node.id] ? "＋" : "－"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Floating Toolbar controls */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1.5 bg-[#0A0D15]/95 border border-border/10 rounded-xl shadow-lg select-none">
          <Button variant="ghost" size="sm" onClick={() => handleZoom("in")} className="h-7 px-2.5 text-[10px] font-mono text-foreground cursor-pointer">
            Zoom +
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleZoom("out")} className="h-7 px-2.5 text-[10px] font-mono text-foreground cursor-pointer">
            Zoom -
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCenter} className="h-7 px-2.5 text-[10px] font-mono text-foreground cursor-pointer">
            Center Graph
          </Button>
        </div>
      </div>

      {/* RIGHT SIDEBAR: SELECTED NODE INSIGHTS */}
      {selectedNode && (
        <div className="w-64 border-l border-border/10 p-4 bg-[#0A0D15]/85 flex flex-col gap-4 select-text shrink-0">
          <div className="flex items-center justify-between border-b border-border/10 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Code size={13} className="text-primary" />
              <span className="text-[10px] font-mono uppercase font-bold text-foreground">Node Details</span>
            </div>
            <button 
              onClick={() => setSelectedNodeId(null)}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-[#1E2538]/40 transition-all cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body stats */}
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[9px] font-mono uppercase text-muted-foreground/60 block">File Name</span>
              <span className="text-foreground font-semibold break-all font-mono">{selectedNode.name}</span>
            </div>

            <div>
              <span className="text-[9px] font-mono uppercase text-muted-foreground/60 block">File Path</span>
              <span className="text-muted-foreground break-all font-mono text-[10px] select-text">{selectedNode.path}</span>
            </div>

            {selectedNode.type !== "folder" && (
              <div>
                <span className="text-[9px] font-mono uppercase text-muted-foreground/60 block">Lines of Code</span>
                <span className="text-foreground font-mono font-semibold">{selectedNode.metadata.linesOfCode} lines</span>
              </div>
            )}

            <div>
              <span className="text-[9px] font-mono uppercase text-muted-foreground/60 block">Purpose</span>
              <span className="text-foreground text-[11px] leading-relaxed">{selectedNode.metadata.purpose}</span>
            </div>

            {/* Relations mapping links */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/60 block">Dependencies</span>
              {selectedNode.metadata.dependencies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedNode.metadata.dependencies.map(dep => (
                    <span 
                      key={dep} 
                      onClick={() => setSelectedNodeId(dep)}
                      className="px-2 py-0.5 bg-[#111622] hover:bg-[#1E2538] border border-border/10 text-[9px] font-mono text-muted-foreground hover:text-foreground rounded cursor-pointer truncate max-w-[120px]"
                    >
                      {dep.split("/").pop()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground/45 italic font-mono">No direct dependencies</span>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/60 block">Dependents</span>
              {selectedNode.metadata.dependents.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedNode.metadata.dependents.map(dep => (
                    <span 
                      key={dep} 
                      onClick={() => setSelectedNodeId(dep)}
                      className="px-2 py-0.5 bg-[#111622] hover:bg-[#1E2538] border border-border/10 text-[9px] font-mono text-muted-foreground hover:text-foreground rounded cursor-pointer truncate max-w-[120px]"
                    >
                      {dep.split("/").pop()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground/45 italic font-mono">No direct dependents</span>
              )}
            </div>

            {/* Jump Link CTA */}
            {selectedNode.type !== "folder" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectFile(selectedNode.path)}
                className="w-full h-8 text-[11px] font-bold border-primary/20 hover:bg-primary/10 text-primary cursor-pointer gap-1"
              >
                <span>Double Click to Open</span>
                <ExternalLink size={11} />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
