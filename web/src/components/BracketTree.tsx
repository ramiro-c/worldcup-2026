import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { BracketRound, BracketMatch } from "../lib/types";

interface BracketTreeProps {
  rounds: BracketRound[];
}

interface BracketNode {
  data: BracketMatch;
  children?: BracketNode[];
}

const CARD_WIDTH = 150;
const CARD_HEIGHT = 42;
const ROUND_SPACING = 180;
const VERTICAL_SPACING = 48;
const PADDING_TOP = 40;
const PADDING_SIDE = 20;

export default function BracketTree({ rounds }: BracketTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);

  useEffect(() => {
    const el = svgRef.current;
    setHierarchyError(null);
    if (!el || rounds.length === 0) return;

    const svg = d3.select(el);
    svg.selectAll("*").remove();

    const hierarchyData = buildHierarchy(rounds);
    if (!hierarchyData) {
      setHierarchyError("No se pudo construir el cuadro eliminatorio");
      return;
    }

    // ── Tree layout ──────────────────────────────────────
    const root = d3.hierarchy(hierarchyData);
    d3.tree<BracketNode>().nodeSize([ROUND_SPACING, VERTICAL_SPACING])(root);

    // Swap x/y for left-to-right, reverse depth so R32 is leftmost
    const maxDepth = d3.max(root.descendants(), (n) => n.depth) ?? 4;
    root.each((node) => {
      const treeX = node.x!;
      node.x = (maxDepth - node.depth) * ROUND_SPACING + PADDING_SIDE;
      node.y = treeX;
    });

    // Compute viewBox bounds — must include negative coordinates
    // produced by the tree layout (R32 top half extends to negative y).
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    root.each((n) => {
      if (n.x! < minX) minX = n.x!;
      if (n.x! > maxX) maxX = n.x!;
      if (n.y! < minY) minY = n.y!;
      if (n.y! > maxY) maxY = n.y!;
    });
    const viewBoxMinX = Math.min(0, minX - CARD_WIDTH / 2 - 10);
    const viewBoxMinY = Math.min(0, minY - CARD_HEIGHT / 2 - 10);
    const svgWidth = (maxDepth + 1) * ROUND_SPACING + CARD_WIDTH + PADDING_SIDE * 2;
    const svgHeight = maxY - minY + CARD_HEIGHT + PADDING_TOP + 40;

    svg.attr("viewBox", `${viewBoxMinX} ${viewBoxMinY} ${svgWidth} ${svgHeight}`);

    // ── Defs: clip path for crests ───────────────────────
    const defs = svg.append("defs");
    defs.append("clipPath")
      .attr("id", "crest-clip")
      .append("circle")
      .attr("r", 11)
      .attr("cx", 11)
      .attr("cy", 11);

    // ── Connector lines ──────────────────────────────────
    const linkGen = d3.linkHorizontal<any, any>()
      .x((d) => d[0])
      .y((d) => d[1]);

    const linkGroup = svg.append("g").attr("class", "links");
    root.links().forEach((link) => {
      // link.source = later round (right), link.target = earlier round (left)
      // Draw connector from right edge of earlier round to left edge of later round
      const sx = link.target.x! + CARD_WIDTH / 2;
      const sy = link.target.y!;
      const tx = link.source.x! - CARD_WIDTH / 2;
      const ty = link.source.y!;
      linkGroup
        .append("path")
        .attr("d", linkGen({ source: [sx, sy], target: [tx, ty] }))
        .attr("fill", "none")
        .attr("stroke", "#3f3f46")
        .attr("stroke-width", 2);
    });

    // ── Round labels (positioned above the topmost card in each round) ──
    const roundNodes = new Map<string, d3.HierarchyNode<BracketNode>[]>();
    root.each((node) => {
      const arr = roundNodes.get(node.data.data.round) ?? [];
      arr.push(node);
      roundNodes.set(node.data.data.round, arr);
    });

    const labelGroup = svg.append("g").attr("class", "round-labels");
    roundNodes.forEach((nodes, round) => {
      const roundDef = rounds.find((r) => r.name === round);
      if (!roundDef || nodes.length === 0) return;
      const minYInRound = Math.min(...nodes.map((n) => n.y!));
      const anchor = nodes[0]!;
      labelGroup
        .append("text")
        .attr("x", anchor.x!)
        .attr("y", minYInRound - CARD_HEIGHT / 2 - 8)
        .attr("fill", "#a1a1aa")
        .attr("font-size", 13)
        .attr("font-weight", "700")
        .attr("text-anchor", "middle")
        .attr("font-family", "system-ui, sans-serif")
        .text(roundDef.label);
    });

    // ── Match slot rendering ─────────────────────────────
    const nodeGroup = svg.append("g").attr("class", "nodes");
    root.each((node) => {
      const match = node.data.data;
      const hasTeam = match.home_team_name != null || match.away_team_name != null;

      const g = nodeGroup
        .append("g")
        .attr(
          "transform",
          `translate(${node.x! - CARD_WIDTH / 2}, ${node.y! - CARD_HEIGHT / 2})`,
        )
        .attr("data-match-id", match.id)
        .attr("data-next-match-id", match.next_match_id ?? "")
        .attr("data-has-team", hasTeam ? "true" : "false")
        .attr("class", "match-slot");

      // TBD slot: dashed border
      g.append("rect")
        .attr("width", CARD_WIDTH)
        .attr("height", CARD_HEIGHT)
        .attr("rx", 6)
        .attr("fill", "#18181b")
        .attr("stroke", "#3f3f46")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", hasTeam ? "0" : "4 3");

      // Team slot rendering
      renderTeamSlot(g, match.home_team_name, match.home_crest, match.home_score, match.home_team, 10, true);
      renderTeamSlot(g, match.away_team_name, match.away_crest, match.away_score, match.away_team, 31, false);
    });

    // ── Hover: path-to-final highlight ───────────────────
    const allSlots = nodeGroup.selectAll<SVGGElement, unknown>(".match-slot");

    svg.on("mouseover.highlight", (event: MouseEvent) => {
      const target = event.target as SVGElement;
      const slot = target.closest<SVGGElement>("[data-match-id]");
      if (!slot) return;

      const hasTeam = slot.getAttribute("data-has-team") === "true";
      if (!hasTeam) return;

      // Build highlight chain
      const chain: SVGGElement[] = [slot];
      let currentId = slot.getAttribute("data-next-match-id");
      while (currentId) {
        const next = el.querySelector<SVGGElement>(`[data-match-id="${currentId}"]`);
        if (!next) break;
        chain.push(next);
        currentId = next.getAttribute("data-next-match-id");
      }

      const chainSet = new Set(chain);
      allSlots.each(function () {
        const isHighlighted = chainSet.has(this);
        d3.select(this)
          .classed("highlighted", isHighlighted)
          .classed("dimmed", !isHighlighted);
      });
    });

    svg.on("mouseout.highlight", () => {
      allSlots.classed("highlighted", false).classed("dimmed", false);
    });

    // Cleanup on unmount
    return () => {
      svg.on("mouseover.highlight", null);
      svg.on("mouseout.highlight", null);
    };
  }, [rounds]);

  if (hierarchyError) {
    return (
      <div className="overflow-auto">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">{hierarchyError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ maxWidth: 1200, minHeight: 400 }}
      >
        <style>{`
          .match-slot { transition: opacity 0.2s ease; }
          .match-slot.dimmed { opacity: 0.25; }
          .match-slot.highlighted rect { stroke: #10b981; stroke-width: 2; }
          .match-slot.highlighted text.score { fill: #10b981; }
        `}</style>
      </svg>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────

function renderTeamSlot(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  name: string | null,
  crest: string | null,
  score: number | null,
  code: string | null,
  y: number,
  _isHome: boolean,
) {
  if (name) {
    // Crest image
    if (crest) {
      g.append("image")
        .attr("href", crest)
        .attr("x", 6)
        .attr("y", y - 9)
        .attr("width", 22)
        .attr("height", 22)
        .attr("clip-path", "url(#crest-clip)");
    }

    // Team code (FIFA 3-letter code)
    g.append("text")
      .attr("x", 30)
      .attr("y", y + 4)
      .attr("fill", "#e4e4e7")
      .attr("font-size", 11)
      .attr("font-weight", "600")
      .attr("font-family", "system-ui, sans-serif")
      .text(code ?? name.substring(0, 3).toUpperCase());

    // Score
    g.append("text")
      .attr("x", CARD_WIDTH - 10)
      .attr("y", y + 4)
      .attr("fill", score != null ? "#e4e4e7" : "#52525b")
      .attr("font-size", 11)
      .attr("font-weight", "700")
      .attr("text-anchor", "end")
      .attr("font-family", "system-ui, sans-serif")
      .attr("class", "score")
      .text(score != null ? String(score) : "—");
  } else {
    // TBD state
    g.append("text")
      .attr("x", 10)
      .attr("y", y + 4)
      .attr("fill", "#52525b")
      .attr("font-size", 11)
      .attr("font-style", "italic")
      .attr("font-family", "system-ui, sans-serif")
      .text("TBD");

    g.append("text")
      .attr("x", CARD_WIDTH - 10)
      .attr("y", y + 4)
      .attr("fill", "#52525b")
      .attr("font-size", 11)
      .attr("text-anchor", "end")
      .attr("font-family", "system-ui, sans-serif")
      .text("—");
  }

  // Divider line between home/away
  g.append("line")
    .attr("x1", 0)
    .attr("y1", 21)
    .attr("x2", CARD_WIDTH)
    .attr("y2", 21)
    .attr("stroke", "#27272a")
    .attr("stroke-width", 1);
}

function buildHierarchy(rounds: BracketRound[]): BracketNode | null {
  // Build next_match_id → feeders map (children by next_match pointer)
  const feedMap = new Map<string, BracketMatch[]>();
  for (const r of rounds) {
    for (const m of r.matches) {
      if (m.next_match_id) {
        const feeders = feedMap.get(m.next_match_id) ?? [];
        feeders.push(m);
        feedMap.set(m.next_match_id, feeders);
      }
    }
  }

  // Find the Final match (root)
  const finalRound = rounds.find((r) => r.name === "final");
  if (!finalRound || finalRound.matches.length === 0) return null;
  const finalMatch = finalRound.matches[0];

  function buildNode(match: BracketMatch): BracketNode {
    const children = feedMap.get(match.id) ?? [];
    return {
      data: match,
      children: children.length > 0 ? children.map(buildNode) : undefined,
    };
  }

  return buildNode(finalMatch);
}
