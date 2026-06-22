export const tooltipStyle = {
  background: "rgba(9, 9, 11, 0.95)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 10,
  color: "#f4f4f5",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 20px 40px -20px rgba(0,0,0,0.8)",
} as const;

export function formatAxisLabel(label: string) {
  const labelMap: Record<string, string> = {
    "Problem-solving": "Problem",
    Brainstorming: "Ideas",
    "Research skill": "Research",
    "Learning speed": "Learning",
    "Analytical thinking": "Analytical",
    "Technical/logical thinking": "Tech/logical",
    "Communication clarity": "Comm.",
    "Decision making": "Decision",
    "Self-correction": "Self-correct",
    "Planning/execution": "Planning",
    "Curiosity/initiative": "Curiosity",
    "Persistence/consistency": "Persistence",
    "Prompt quality": "Prompt",
  };

  return labelMap[label] ?? label;
}
