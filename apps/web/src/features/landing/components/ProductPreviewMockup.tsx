"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { GitFork, Layers, Compass } from "lucide-react"

export function ProductPreviewMockup() {
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null)

  const nodes = [
    { id: "layout", label: "app/layout.tsx", x: 250, y: 150, type: "entry", deps: ["navbar", "footer"] },
    { id: "navbar", label: "components/layout/Navbar.tsx", x: 120, y: 260, type: "component", deps: ["logo", "button"] },
    { id: "footer", label: "components/layout/Footer.tsx", x: 380, y: 260, type: "component", deps: ["logo"] },
    { id: "logo", label: "components/layout/Logo.tsx", x: 250, y: 370, type: "shared", deps: [] },
    { id: "button", label: "components/ui/button.tsx", x: 70, y: 370, type: "shared", deps: ["utils"] },
    { id: "utils", label: "lib/utils.ts", x: 160, y: 440, type: "util", deps: [] },
  ]

  const connections = [
    { from: "layout", to: "navbar" },
    { from: "layout", to: "footer" },
    { from: "navbar", to: "logo" },
    { from: "navbar", to: "button" },
    { from: "footer", to: "logo" },
    { from: "button", to: "utils" },
  ]

  return (
    <div className="w-full rounded-xl border border-border/60 bg-[#0F1420]/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-sm max-w-5xl mx-auto flex flex-col">
      {/* Tool panel header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border/40 bg-[#0B0F19]/90 select-none">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground font-mono">architecture-visualization</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
            <Compass className="size-3 text-secondary" /> Dynamic Scan: OK
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
            <GitFork className="size-3 text-primary" /> Branches tracked: 12
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row min-h-[400px]">
        {/* Left Side: interactive canvas */}
        <div className="flex-1 bg-[#090D16] relative p-6 flex items-center justify-center overflow-hidden min-h-[350px]">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Grid overlay */}
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Connection Lines */}
            {connections.map((conn, idx) => {
              const fromNode = nodes.find((n) => n.id === conn.from)
              const toNode = nodes.find((n) => n.id === conn.to)
              if (!fromNode || !toNode) return null

              const isHighlighted = hoveredNode === conn.from || hoveredNode === conn.to

              return (
                <g key={idx}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={isHighlighted ? "#8B5CF6" : "#1F2937"}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    className="transition-all duration-300"
                  />
                  {isHighlighted && (
                    <motion.circle
                      r="4"
                      fill="#3B82F6"
                      animate={{
                        cx: [fromNode.x, toNode.x],
                        cy: [fromNode.y, toNode.y],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </g>
              )
            })}
          </svg>

          {/* Interactive Nodes */}
          <div className="relative w-full h-[450px]">
            {nodes.map((node) => {
              const isHovered = hoveredNode === node.id
              const isDependency = hoveredNode && nodes.find((n) => n.id === hoveredNode)?.deps.includes(node.id)
              const isParent = hoveredNode && node.deps.includes(hoveredNode)

              return (
                <div
                  key={node.id}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono font-medium transition-all duration-300 cursor-pointer shadow-md select-none ${
                    isHovered
                      ? "border-secondary bg-secondary/10 text-foreground scale-105 shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                      : isDependency
                      ? "border-primary/80 bg-primary/5 text-foreground"
                      : isParent
                      ? "border-primary/80 bg-primary/5 text-foreground"
                      : "border-border bg-[#111827]/90 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`size-1.5 rounded-full ${
                        node.type === "entry"
                          ? "bg-emerald-400"
                          : node.type === "component"
                          ? "bg-primary"
                          : "bg-secondary"
                      }`}
                    />
                    <span>{node.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Side: details panel */}
        <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border/40 bg-[#0A0E17]/95 p-4 flex flex-col justify-between text-xs select-none">
          <div className="space-y-4">
            <div className="border-b border-border/40 pb-2">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                Node Inspector
              </h4>
            </div>

            {hoveredNode ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div>
                  <div className="text-[10px] text-muted-foreground font-mono">FILE PATH</div>
                  <div className="font-semibold font-mono text-foreground break-all">
                    {nodes.find((n) => n.id === hoveredNode)?.label}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted-foreground font-mono">TYPE</div>
                  <div className="capitalize font-medium text-secondary">
                    {nodes.find((n) => n.id === hoveredNode)?.type} file
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted-foreground font-mono">IMPORTS OUT ({nodes.find((n) => n.id === hoveredNode)?.deps.length})</div>
                  <div className="font-mono text-[10px] text-foreground mt-1 space-y-1">
                    {nodes.find((n) => n.id === hoveredNode)?.deps.length === 0 ? (
                      <span className="text-muted-foreground italic">None</span>
                    ) : (
                      nodes
                        .find((n) => n.id === hoveredNode)
                        ?.deps.map((depId) => (
                          <div key={depId} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-primary" />
                            <span>{nodes.find((n) => n.id === depId)?.label.split("/").pop()}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-muted-foreground py-8 text-center italic">
                Hover over any node in the graph map to inspect dependencies.
              </div>
            )}
          </div>

          <div className="border-t border-border/40 pt-4 mt-4 text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Interactive Demo:</span> CodeAtlas automatically updates maps dynamically on every Git push.
          </div>
        </div>
      </div>
    </div>
  )
}
