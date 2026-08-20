import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { CyberAttackNode } from './CyberAttackNode';
import {
  Maximize2,
  GitBranch,
  Shield,
} from 'lucide-react';
import type { AttackStage } from '../types/sentinel';

interface AttackGraphProps {
  nodes: Node[];
  edges: Edge[];
  attackStage: AttackStage;
  riskScore: number;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
}

const nodeTypes = {
  cyberAttackNode: CyberAttackNode,
};

const FlowCanvas: React.FC<AttackGraphProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
}) => {
  const { fitView } = useReactFlow();

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.25, duration: 800 });
  }, [fitView]);

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#080D1A] rounded-xl border border-[#1F3158] overflow-hidden flex flex-col">
      {/* HUD Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0B1224]/90 border-b border-[#1F3158] backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#00D2D3]" />
            <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              Directed Causal Attack Graph
            </span>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#111C33] border border-[#1F3158] text-[#8E9EB8]">
            NetworkX Sliding Window (30m)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFitView}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-[#111C33] hover:bg-[#182747] border border-[#1F3158] hover:border-[#00D2D3] text-slate-300 transition-colors cursor-pointer"
            title="Auto Center Graph"
          >
            <Maximize2 className="w-3 h-3 text-[#00D2D3]" />
            <span>FIT VIEW</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full h-full">
        {initialNodes.length === 0 ? (
          /* Empty State: Cyber Radar Scanner */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
            <div className="relative w-40 h-40 mb-4 flex items-center justify-center">
              {/* Radar rings */}
              <div className="absolute inset-0 rounded-full border border-[#00D2D3]/20 animate-ping opacity-30" />
              <div className="absolute inset-4 rounded-full border border-[#00D2D3]/40" />
              <div className="absolute inset-10 rounded-full border border-[#00D2D3]/60" />
              <div className="absolute inset-16 rounded-full border border-[#00D2D3]/80" />
              
              {/* Rotating Radar Sweep */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-[#00D2D3]/10 to-[#00D2D3]/30 animate-radar pointer-events-none" />
              
              <Shield className="w-10 h-10 text-[#00D2D3] animate-pulse" />
            </div>

            <h3 className="text-sm font-mono font-bold text-white tracking-wider">
              AWAITING ANOMALOUS TELEMETRY INGRESS
            </h3>
            <p className="text-xs text-[#8E9EB8] max-w-md mt-1 font-mono">
              Trigger an attack vector from the <span className="text-[#00D2D3] font-semibold">Attack Chain Simulator</span> on the left to activate deterministic graph correlation.
            </p>
          </div>
        ) : null}

        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
          }}
          className="bg-transparent"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="#1F3158"
          />
          <Controls
            className="!bg-[#111C33] !border-[#1F3158] !text-slate-300"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.severity === 'ATO_ATTACK') return '#FF2E93';
              if (node.data?.severity === 'ELEVATED') return '#F59E0B';
              return '#00D2D3';
            }}
            maskColor="rgba(8, 13, 26, 0.75)"
            className="!bottom-4 !right-4 !w-36 !h-28"
          />
        </ReactFlow>
      </div>

      {/* Bottom Live Threat Graph Status Bar */}
      <div className="px-4 py-2 bg-[#0B1224]/90 border-t border-[#1F3158] flex items-center justify-between text-[11px] font-mono text-[#8E9EB8]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00D2D3] shadow-cyan-glow" />
            <span>Verified / Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-amber-glow" />
            <span>Elevated Anomaly</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF2E93] shadow-magenta-glow animate-pulse" />
            <span>Correlated ATO Node</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Active Edges: <strong className="text-white">{initialEdges.length}</strong></span>
          <span>•</span>
          <span>Graph Density: <strong className="text-[#00D2D3]">
            {initialNodes.length > 1 ? (initialEdges.length / (initialNodes.length * (initialNodes.length - 1))).toFixed(2) : '0.00'}
          </strong></span>
        </div>
      </div>
    </div>
  );
};

export const AttackGraph: React.FC<AttackGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
};
