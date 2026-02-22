"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence } from "framer-motion";
import ArticleNode from "./ArticleNode";
import ArticleEditor from "./ArticleEditor";
import CanvasToolbar from "./CanvasToolbar";
import CosmicBackground from "./CosmicBackground";
import VintageEdge from "./VintageEdge";
import { useMode } from "@/contexts/ModeContext";
import type { Article } from "@/types";

const nodeTypes: NodeTypes = {
  article: ArticleNode,
};

const edgeTypes: EdgeTypes = {
  vintage: VintageEdge,
};

function CanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editingNodeRect, setEditingNodeRect] = useState<DOMRect | null>(null);
  const reactFlowInstance = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const { mode } = useMode();

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/links?mode=${mode}`);
      if (!res.ok) return;
      const links = await res.json();
      const flowEdges: Edge[] = links.map((link: { id: string; sourceId: string; targetId: string }) => ({
        id: link.id,
        source: link.sourceId,
        target: link.targetId,
        type: "vintage",
      }));
      setEdges(flowEdges);
    } catch {
      // links API might not be available yet
    }
  }, [setEdges, mode]);

  const fetchArticles = useCallback(async () => {
    const res = await fetch(`/api/articles?mode=${mode}`);
    const data: Article[] = await res.json();
    setArticles(data);

    const flowNodes: Node[] = data.map((article) => ({
      id: article.id,
      type: "article",
      position: { x: article.positionX, y: article.positionY },
      data: {
        title: article.title,
        status: article.status,
        slug: article.slug,
        onEdit: (slug: string) => handleOpenEditor(slug),
      },
    }));

    setNodes(flowNodes);
    await fetchLinks();
  }, [setNodes, fetchLinks, mode]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleOpenEditor = useCallback((slug: string) => {
    const nodeEl = document.querySelector(`[data-id="${slug}"]`) ||
      document.querySelector(`.react-flow__node[data-id]`);

    if (nodeEl) {
      setEditingNodeRect(nodeEl.getBoundingClientRect());
    } else {
      setEditingNodeRect(null);
    }
    setEditingSlug(slug);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditingSlug(null);
    setEditingNodeRect(null);
    fetchArticles();
  }, [fetchArticles]);

  const handleNewArticle = useCallback(async () => {
    const viewport = reactFlowInstance.getViewport();
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom;

    const offsetX = (Math.random() - 0.5) * 200;
    const offsetY = (Math.random() - 0.5) * 200;

    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled",
        positionX: centerX + offsetX,
        positionY: centerY + offsetY,
        mode,
      }),
    });

    if (res.ok) {
      await fetchArticles();
    }
  }, [reactFlowInstance, fetchArticles, mode]);

  const handleNodeDragStop = useCallback(
    async (_event: React.MouseEvent, node: Node) => {
      const article = articles.find((a) => a.id === node.id);
      if (!article) return;

      await fetch(`/api/articles/${article.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionX: node.position.x,
          positionY: node.position.y,
        }),
      });
    },
    [articles]
  );

  const editingArticle = articles.find((a) => a.slug === editingSlug) || null;

  return (
    <div ref={containerRef} className="w-screen h-screen relative">
      <CosmicBackground />
      <CanvasToolbar onNewArticle={handleNewArticle} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        minZoom={0.2}
        maxZoom={2}
        className="!bg-transparent relative z-10"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(120, 113, 108, 0.06)" gap={40} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-transparent !border-0 !shadow-none"
        />
      </ReactFlow>

      <AnimatePresence>
        {editingSlug && editingArticle && (
          <ArticleEditor
            article={editingArticle}
            allArticles={articles}
            nodeRect={editingNodeRect}
            onClose={handleCloseEditor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CanvasView() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
