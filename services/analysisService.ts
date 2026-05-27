import { ScoreCategory, ScoreKey, ScoreMap } from "@/types/score";

export const SCORE_CATEGORIES: ScoreCategory[] = [
  {
    key: "problemSolving",
    label: "Problem-solving",
    aliases: ["problem-solving", "problem solving", "problemsolving"],
    weight: 0.22,
  },
  {
    key: "creativity",
    label: "Creativity",
    aliases: ["creativity", "creative thinking"],
    weight: 0.16,
  },
  {
    key: "learningSpeed",
    label: "Learning speed",
    aliases: ["learning speed", "learning-speed", "learning agility"],
    weight: 0.16,
  },
  {
    key: "analyticalThinking",
    label: "Analytical thinking",
    aliases: ["analytical thinking", "analysis", "analytical-thinking"],
    weight: 0.18,
  },
  {
    key: "researchSkill",
    label: "Research skill",
    aliases: ["research skill", "research skills", "research"],
    weight: 0.14,
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
    weight: 0.14,
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
    const categoryPattern = escapeRegex(alias).replace(/\\ /g, "\\s+");
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
  const overallScore = calculateOverallScore(scores);

  return {
    scores,
    overallScore,
    analyzed: true,
  };
}

export function getScoreLabel(key: ScoreKey) {
  return SCORE_CATEGORIES.find((category) => category.key === key)?.label ?? key;
}
