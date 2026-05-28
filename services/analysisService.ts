import { ScoreCategory, ScoreKey, ScoreMap } from "@/types/score";

export const SCORE_CATEGORIES: ScoreCategory[] = [
  {
    key: "problemSolving",
    label: "Problem-solving",
    aliases: [
      "problem-solving",
      "problem solving",
      "problem-solving ability",
      "problem solving ability",
    ],
    weight: 0.15,
  },
  {
    key: "analyticalThinking",
    label: "Analytical thinking",
    aliases: ["analytical thinking", "analysis", "analytical-thinking"],
    weight: 0.12,
  },
  {
    key: "learningSpeed",
    label: "Learning speed",
    aliases: ["learning speed", "learning-speed", "learning agility"],
    weight: 0.1,
  },
  {
    key: "researchSkill",
    label: "Research skill",
    aliases: ["research skill", "research skills", "research"],
    weight: 0.1,
  },
  {
    key: "brainstorming",
    label: "Brainstorming",
    aliases: [
      "brainstorming",
      "idea generation",
      "brainstorming / idea generation",
      "brainstorming idea generation",
    ],
    weight: 0.1,
  },
  {
    key: "technicalThinking",
    label: "Technical/logical thinking",
    aliases: [
      "technical/logical thinking",
      "technical logical thinking",
      "technical / logical thinking",
      "technical/logical",
      "technical logical",
      "logical thinking",
      "technical thinking",
    ],
    weight: 0.1,
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
    key: "adaptability",
    label: "Adaptability",
    aliases: ["adaptability", "adaptable thinking"],
    weight: 0.07,
  },
  {
    key: "selfCorrection",
    label: "Self-correction",
    aliases: [
      "self-correction",
      "self correction",
      "self-correction / improvement",
      "self correction improvement",
      "self improvement",
    ],
    weight: 0.07,
  },
  {
    key: "planningExecution",
    label: "Planning/execution",
    aliases: [
      "planning/execution",
      "planning execution",
      "planning & execution",
      "planning and execution",
      "planning",
      "execution",
    ],
    weight: 0.06,
  },
  {
    key: "curiosityInitiative",
    label: "Curiosity/initiative",
    aliases: [
      "curiosity/initiative",
      "curiosity & initiative",
      "curiosity and initiative",
      "curiosity initiative",
      "initiative",
    ],
    weight: 0.05,
  },
  {
    key: "persistence",
    label: "Persistence/consistency",
    aliases: [
      "persistence",
      "consistency",
      "persistence / consistency",
      "persistence consistency",
      "perseverance",
    ],
    weight: 0.05,
  },
  {
    key: "creativity",
    label: "Creativity",
    aliases: ["creativity", "creative thinking"],
    weight: 0.03,
  },
  {
    key: "promptQuality",
    label: "Prompt quality",
    aliases: [
      "prompt quality",
      "prompting quality",
      "prompt effectiveness",
      "ability to ask useful questions",
      "asking useful questions",
      "prompt quality / ability to ask useful questions",
      "prompt quality asking useful questions",
    ],
    weight: 0.02,
  },
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function normalizeScoreLine(line: string) {
  return line
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/[–—]/g, "-")
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
    .trim();
}

function normalizeForCompare(value: string) {
  return normalizeScoreLine(value)
    .toLowerCase()
    .replace(/[\/&]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMarkdownTableScore(
  responseText: string,
  category: ScoreCategory,
) {
  const aliases = category.aliases.map(normalizeForCompare);
  const lines = responseText.split(/\r?\n/);

  for (const line of lines) {
    if (!line.includes("|")) {
      continue;
    }

    const cells = line
      .split("|")
      .map((cell) => normalizeScoreLine(cell))
      .filter(Boolean);

    if (cells.length < 2 || cells.every((cell) => /^-+$/.test(cell))) {
      continue;
    }

    const categoryCell = normalizeForCompare(cells[0]);
    const matchesCategory = aliases.some(
      (alias) => categoryCell.includes(alias) || alias.includes(categoryCell),
    );

    if (!matchesCategory) {
      continue;
    }

    const scoreCell = cells.find((cell, index) => {
      if (index === 0) {
        return false;
      }

      return /\b\d{1,3}\b/.test(cell);
    });
    const scoreMatch = scoreCell?.match(/\b(\d{1,3})\b/);

    if (scoreMatch?.[1]) {
      return clampScore(Number(scoreMatch[1]));
    }
  }

  return undefined;
}

function extractInlineCompressedScore(
  responseText: string,
  category: ScoreCategory,
) {
  const normalizedText = responseText
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/[–—]/g, "-");

  for (const alias of category.aliases) {
    const categoryPattern = escapeRegex(alias).replace(/\s+/g, "\\s*");
    const scoreRegex = new RegExp(
      `${categoryPattern}\\s*(?:ability|quality|skill)?\\s*(?:[:\\-=])?\\s*(\\d{1,3})(?:\\s*/\\s*100|\\s*%)?`,
      "i",
    );
    const match = normalizedText.match(scoreRegex);

    if (match?.[1]) {
      return clampScore(Number(match[1]));
    }
  }

  return undefined;
}

function extractLineScore(responseText: string, category: ScoreCategory) {
  const lines = responseText.split(/\r?\n/).map(normalizeScoreLine);

  for (const alias of category.aliases) {
    const categoryPattern = escapeRegex(alias).replace(/\s+/g, "\\s+");
    const scoreRegexes = [
      new RegExp(
        `^${categoryPattern}[^\\d\\n\\r]*(?:[:\\-=]|score\\s*[:\\-=]?)\\s*(\\d{1,3})(?:\\s*/\\s*100|\\s*%?)?`,
        "i",
      ),
      new RegExp(
        `^${categoryPattern}.*?\\b(?:score\\s*)?(\\d{1,3})(?:\\s*/\\s*100|\\s*%?)?\\b`,
        "i",
      ),
    ];

    for (const line of lines) {
      const match = scoreRegexes
        .map((scoreRegex) => line.match(scoreRegex))
        .find(Boolean);

      if (match?.[1]) {
        return clampScore(Number(match[1]));
      }
    }
  }

  return undefined;
}

function extractCategoryScore(responseText: string, category: ScoreCategory) {
  return (
    extractMarkdownTableScore(responseText, category) ??
    extractInlineCompressedScore(responseText, category) ??
    extractLineScore(responseText, category)
  );
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
  const normalizedText = responseText
    .split(/\r?\n/)
    .map(normalizeScoreLine)
    .join("\n");
  const scoreRegexes = [
    /(?:final\s+)?(?:weighted\s+)?overall\s+score\s*[:\-=]\s*(\d{1,3})(?:\s*\/\s*100|\s*%?)?/i,
    /final\s+(?:weighted\s+)?score\s*[:\-=]\s*(\d{1,3})(?:\s*\/\s*100|\s*%?)?/i,
  ];
  const match = scoreRegexes
    .map((scoreRegex) => normalizedText.match(scoreRegex))
    .find(Boolean);

  if (!match?.[1]) {
    return null;
  }

  return clampScore(Number(match[1]));
}

export function getWeightedScoreBreakdown(scores: ScoreMap) {
  return SCORE_CATEGORIES.flatMap((category) => {
    const score = scores[category.key];

    if (score === undefined) {
      return [];
    }

    return [
      {
        key: category.key,
        label: category.label,
        score,
        weight: category.weight,
        weightedValue: score * category.weight,
      },
    ];
  });
}

export function calculateOverallScore(scores: ScoreMap) {
  const weightedTotal = getWeightedScoreBreakdown(scores).reduce(
    (total, item) => total + item.weightedValue,
    0,
  );

  return Math.round(weightedTotal);
}

export function analyzeResponse(responseText: string) {
  const scores = extractScores(responseText);
  const aiReportedScore = extractAiReportedScore(responseText);
  const weightedBreakdown = getWeightedScoreBreakdown(scores);
  const calculatedScore = calculateOverallScore(scores);

  console.log("[analysis] parsed categories", scores);
  console.table(weightedBreakdown);
  console.log("[analysis] calculated score", calculatedScore);
  console.log("[analysis] AI reported score", aiReportedScore);

  if (Object.keys(scores).length === 0) {
    throw new Error("No category scores were found in the AI response.");
  }

  if (aiReportedScore === null) {
    throw new Error("Final Overall Score was not found in the AI response.");
  }

  if (Math.abs(aiReportedScore - calculatedScore) > 1) {
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
