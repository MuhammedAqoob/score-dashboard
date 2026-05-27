import { ScoreCategory, ScoreKey, ScoreMap } from "@/types/score";

export const SCORE_CATEGORIES: ScoreCategory[] = [
  {
    key: "problemSolving",
    label: "Problem-solving",
    aliases: ["problem-solving", "problem solving", "problemsolving"],
    weight: 0.1,
  },
  {
    key: "brainstorming",
    label: "Brainstorming",
    aliases: ["brainstorming", "idea generation"],
    weight: 0.07,
  },
  {
    key: "researchSkill",
    label: "Research skill",
    aliases: ["research skill", "research skills", "research"],
    weight: 0.08,
  },
  {
    key: "learningSpeed",
    label: "Learning speed",
    aliases: ["learning speed", "learning-speed", "learning agility"],
    weight: 0.08,
  },
  {
    key: "analyticalThinking",
    label: "Analytical thinking",
    aliases: ["analytical thinking", "analysis", "analytical-thinking"],
    weight: 0.1,
  },
  {
    key: "creativity",
    label: "Creativity",
    aliases: ["creativity", "creative thinking"],
    weight: 0.08,
  },
  {
    key: "technicalLogicalThinking",
    label: "Technical/logical thinking",
    aliases: [
      "technical/logical thinking",
      "technical logical thinking",
      "logical thinking",
      "technical thinking",
    ],
    weight: 0.09,
  },
  {
    key: "communicationClarity",
    label: "Communication clarity",
    aliases: [
      "communication clarity",
      "communication",
      "clarity",
      "communication-clarity",
    ],
    weight: 0.08,
  },
  {
    key: "decisionMaking",
    label: "Decision-making",
    aliases: ["decision-making", "decision making", "judgment"],
    weight: 0.07,
  },
  {
    key: "adaptability",
    label: "Adaptability",
    aliases: ["adaptability", "adaptable thinking"],
    weight: 0.06,
  },
  {
    key: "selfCorrection",
    label: "Self-correction",
    aliases: ["self-correction", "self correction", "self critique"],
    weight: 0.06,
  },
  {
    key: "planningExecution",
    label: "Planning/execution",
    aliases: [
      "planning/execution",
      "planning execution",
      "planning",
      "execution",
    ],
    weight: 0.06,
  },
  {
    key: "persistence",
    label: "Persistence",
    aliases: ["persistence", "perseverance"],
    weight: 0.04,
  },
  {
    key: "promptQuality",
    label: "Prompt quality",
    aliases: ["prompt quality", "prompting quality", "prompt effectiveness"],
    weight: 0.03,
  },
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function extractCategoryScore(responseText: string, category: ScoreCategory) {
  for (const alias of category.aliases) {
    const categoryPattern = escapeRegex(alias).replace(/\s+/g, "\\s+");
    const scoreRegex = new RegExp(
      `(?:^|\\n|\\r)\\s*(?:[-*]\\s*)?${categoryPattern}\\s*[:\\-=]\\s*(\\d{1,3})(?:\\s*/\\s*100|\\s*%?)`,
      "i",
    );
    const match = responseText.match(scoreRegex);

    if (match?.[1]) {
      return clampScore(Number(match[1]));
    }
  }

  return undefined;
}

export function extractScores(responseText: string) {
  return SCORE_CATEGORIES.reduce<ScoreMap>((scores, category) => {
    const score = extractCategoryScore(responseText, category);

    if (score !== undefined) {
      scores[category.key] = score;
    }

    return scores;
  }, {});
}

export function extractAiReportedScore(responseText: string) {
  const scoreRegex =
    /(?:final\s+)?(?:weighted\s+)?(?:overall\s+)?score\s*[:\-=]\s*(\d{1,3})(?:\s*\/\s*100|\s*%?)?/i;
  const match = responseText.match(scoreRegex);

  if (!match?.[1]) {
    return null;
  }

  return clampScore(Number(match[1]));
}

export function calculateOverallScore(scores: ScoreMap) {
  let weightedTotal = 0;
  let usedWeight = 0;

  SCORE_CATEGORIES.forEach((category) => {
    const score = scores[category.key];

    if (score === undefined) {
      return;
    }

    weightedTotal += score * category.weight;
    usedWeight += category.weight;
  });

  if (usedWeight === 0) {
    return 0;
  }

  return Math.round(weightedTotal / usedWeight);
}

export function analyzeResponse(responseText: string) {
  const scores = extractScores(responseText);
  const aiReportedScore = extractAiReportedScore(responseText);
  const calculatedScore = calculateOverallScore(scores);

  if (Object.keys(scores).length === 0) {
    throw new Error("No category scores were found in the AI response.");
  }

  if (aiReportedScore === null) {
    throw new Error("Final Overall Score was not found in the AI response.");
  }

  if (aiReportedScore !== calculatedScore) {
    throw new Error(
      `Score validation failed. AI reported ${aiReportedScore}, but the calculated score is ${calculatedScore}.`,
    );
  }

  return {
    scores,
    aiReportedScore,
    calculatedScore,
    validated: true,
  };
}

export function getScoreLabel(key: ScoreKey) {
  return SCORE_CATEGORIES.find((category) => category.key === key)?.label ?? key;
}
