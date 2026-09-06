import { useCallback, useMemo, useState } from "react";
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { JourneyChannel } from "@/lib/journeys";
import { layoutLinear, type LinearDraftStep } from "@/pages/journey-studio/layout";

type Props = {
  steps: LinearDraftStep[];
  selectedStepIndex: number | null;
  onSelectStep: (index: number | null) => void;
  onInsertAt: (index: number, channel?: JourneyChannel) => void;
  readOnly?: boolean;
};

function TriggerNode({ data }: { data: { title: string; subtitle: string } }) {
  return (
    <div className="mk-rf-node mk-rf-trigger">
      <Handle type="source" position={Position.Bottom} className="mk-rf-handle" />
      <strong>{data.title}</strong>
      <span>{data.subtitle}</span>
    </div>
  );
}

function SendNode({
  data,
  selected,
}: {
  data: {
    index: number;
    channel: string;
    title: string;
    preview: string;
    missingTemplate?: boolean;
  };
  selected?: boolean;
}) {
  return (
    <div
      className={`mk-rf-node mk-rf-send mk-rf-${data.channel} ${selected ? "is-selected" : ""} ${
        data.missingTemplate ? "is-invalid" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="mk-rf-handle" />
      <Handle type="source" position={Position.Bottom} className="mk-rf-handle" />
      <strong>{data.title}</strong>
      <span>{data.preview || "Sin mensaje aún"}</span>
      {data.missingTemplate ? <em>Falta plantilla</em> : null}
    </div>
  );
}

function WebhookNode({ data, selected }: { data: { title: string; preview: string }; selected?: boolean }) {
  return (
    <div className={`mk-rf-node mk-rf-webhook ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="mk-rf-handle" />
      <Handle type="source" position={Position.Bottom} className="mk-rf-handle" />
      <strong>{data.title}</strong>
      <span>{data.preview || "Sin URL"}</span>
    </div>
  );
}

function GoalNode({ data }: { data: { title: string; subtitle: string } }) {
  return (
    <div className="mk-rf-node mk-rf-goal">
      <Handle type="target" position={Position.Top} className="mk-rf-handle" />
      <strong>{data.title}</strong>
      <span>{data.subtitle}</span>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode as never,
  send: SendNode as never,
  webhook: WebhookNode as never,
  goal: GoalNode as never,
};

function InsertMenu({
  x,
  y,
  onPick,
  onClose,
}: {
  x: number;
  y: number;
  onPick: (channel: JourneyChannel) => void;
  onClose: () => void;
}) {
  return (
    <div className="mk-edge-menu" style={{ left: x, top: y }} role="menu">
      {(
        [
          ["whatsapp", "WhatsApp"],
          ["email", "Correo"],
          ["sms", "SMS"],
          ["api", "Avisar a tu sistema"],
        ] as const
      ).map(([channel, label]) => (
        <button key={channel} type="button" role="menuitem" onClick={() => onPick(channel)}>
          {label}
        </button>
      ))}
      <button type="button" className="mk-edge-menu-cancel" onClick={onClose}>
        Cancelar
      </button>
    </div>
  );
}

function makeAddableEdge(onAdd: (insertIndex: number, x: number, y: number) => void) {
  return function AddableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    data,
    markerEnd,
    style,
  }: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
    const insertIndex = Number((data as { index?: number } | undefined)?.index ?? -1);
    const canAdd = insertIndex >= 0;
    return (
      <>
        <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
        <EdgeLabelRenderer>
          <div
            className="mk-edge-label nodrag nopan"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            {label ? <span className="mk-edge-wait">{String(label)}</span> : null}
            {canAdd ? (
              <button
                type="button"
                className="mk-edge-add"
                aria-label="Agregar paso aquí"
                onClick={(event) => {
                  event.stopPropagation();
                  onAdd(insertIndex, event.clientX, event.clientY);
                }}
              >
                +
              </button>
            ) : null}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  };
}

export function FlowCanvas({ steps, selectedStepIndex, onSelectStep, onInsertAt, readOnly }: Props) {
  const { nodes, edges } = useMemo(() => layoutLinear(steps), [steps]);
  const disableZoom = steps.length <= 6;
  const [menu, setMenu] = useState<{ index: number; x: number; y: number } | null>(null);

  const onAdd = useCallback((insertIndex: number, x: number, y: number) => {
    if (readOnly) return;
    setMenu({ index: insertIndex, x, y });
  }, [readOnly]);

  const edgeTypes = useMemo(() => ({ smoothstep: makeAddableEdge(onAdd) }), [onAdd]);

  const decoratedEdges: Edge[] = edges.map((edge) => {
    const isGoal = edge.target === "goal";
    return {
      ...edge,
      type: "smoothstep",
      data: {
        ...(edge.data || {}),
        // Insert before the target step index; for goal edge insert at end.
        index: isGoal ? steps.length : Number((edge.data as { index?: number } | undefined)?.index ?? steps.length),
      },
    };
  });

  // Fix insert index: edges from layoutLinear put index on wait edges as the step being entered.
  // For edge into step-N, insert at N. For edge into goal, insert at steps.length.
  const fixedEdges = decoratedEdges.map((edge) => {
    if (edge.target.startsWith("step-")) {
      const idx = Number(edge.target.replace("step-", ""));
      return { ...edge, data: { ...edge.data, index: idx } };
    }
    if (edge.target === "goal") {
      return { ...edge, data: { ...edge.data, index: steps.length } };
    }
    return edge;
  });

  return (
    <div className="mk-rf-canvas">
      <ReactFlow
        nodes={nodes.map((node: Node) =>
          node.type === "send" || node.type === "webhook"
            ? {
                ...node,
                selected: selectedStepIndex === (node.data as { index?: number }).index,
              }
            : node,
        )}
        edges={fixedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnPinch={!disableZoom}
        zoomOnScroll={!disableZoom}
        minZoom={disableZoom ? 1 : 0.5}
        maxZoom={disableZoom ? 1 : 1.5}
        fitView
        fitViewOptions={{ padding: 0.24 }}
        onNodeClick={(_, node) => {
          const index = (node.data as { index?: number }).index;
          onSelectStep(typeof index === "number" ? index : null);
        }}
        onPaneClick={() => {
          onSelectStep(null);
          setMenu(null);
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} color="rgba(15, 23, 42, 0.06)" />
        {!disableZoom ? <Controls showInteractive={false} /> : null}
      </ReactFlow>

      {!readOnly ? (
        <button
          type="button"
          className="mk-rf-add-end"
          onClick={() => onInsertAt(steps.length, "whatsapp")}
          aria-label="Agregar paso al final"
        >
          +
        </button>
      ) : null}

      {menu ? (
        <InsertMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onPick={(channel) => {
            onInsertAt(menu.index, channel);
            setMenu(null);
          }}
        />
      ) : null}
    </div>
  );
}
