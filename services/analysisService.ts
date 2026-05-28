import { ScoreCategory, ScoreKey, ScoreMap } from "@/types/score";

export class ScoreValidationError extends Error {
  scores: ScoreMap;
  aiReportedScore: number | null;
  calculatedScore: number;

  constructor(
    message: string,
    scores: ScoreMap,
    aiReportedScore: number | null,
    calculatedScore: number,
  ) {
    super(message);
    this.name = "ScoreValidationError";
    this.scores = scores;
    this.aiReportedScore = aiReportedScore;
    this.calculatedScore = calculatedScore;
  }
}

export const SCORE_WEIGHTS: Record<ScoreKey, number> = {
  problemSolving: 15,
  analyticalThinking: 12,
  learningSpeed: 10,
  researchSkill: 10,
  brainstorming: 10,
  technicalThinking: 10,
  communicationClarity: 8,
  adaptability: 7,
  selfCorrection: 7,
  planningExecution: 6,
  curiosityInitiative: 5,
  persistence: 5,
  decisionMaking: 5,
  creativity: 3,
  promptQuality: 2,
};

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
    weight: SCORE_WEIGHTS.problemSolving,
  },
  {
    key: "analyticalThinking",
    label: "Analytical thinking",
    aliases: ["analytical thinking", "analysis", "analytical-thinking"],
    weight: SCORE_WEIGHTS.analyticalThinking,
  },
  {
    key: "learningSpeed",
    label: "Learning speed",
    aliases: ["learning speed", "learning-speed", "learning agility"],
    weight: SCORE_WEIGHTS.learningSpeed,
  },
  {
    key: "researchSkill",
    label: "Research skill",
    aliases: ["research skill", "research skills", "research"],
    weight: SCORE_WEIGHTS.researchSkill,
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
    weight: SCORE_WEIGHTS.brainstorming,
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
    weight: SCORE_WEIGHTS.technicalThinking,
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
    weight: SCORE_WEIGHTS.communicationClarity,
  },
  {
    key: "decisionMaking",
    label: "Decision making",
    aliases: [
      "decision making",
      "decision-making",
      "decision_making",
      "judgment",
    ],
    weight: SCORE_WEIGHTS.decisionMaking,
  },
  {
    key: "adaptability",
    label: "Adaptability",
    aliases: ["adaptability", "adaptable thinking"],
    weight: SCORE_WEIGHTS.adaptability,
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
    weight: SCORE_WEIGHTS.selfCorrection,
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
    weight: SCORE_WEIGHTS.planningExecution,
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
    weight: SCORE_WEIGHTS.curiosityInitiative,
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
    weight: SCORE_WEIGHTS.persistence,
  },
  {
    key: "creativity",
    label: "Creativity",
    aliases: ["creativity", "creative thinking"],
    weight: SCORE_WEIGHTS.creativity,
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
    weight: SCORE_WEIGHTS.promptQuality,
  },
];

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function logAnalysisDebug(...values: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...values);
  }
}

function tableAnalysisDebug(value: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.table(value);
  }
}

function normalizeScoreLine(line: string) {
  return line
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/^\s*(?:[-*]|\d+[.)])\s*/, "")
    .trim();
}

function normalizeScorecardKey(value: string) {
  return normalizeScoreLine(value)
    .toLowerCase()
    .replace(/[\/&-]/g, " ")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractScorecardBlock(responseText: string) {
  const match = responseText.match(
    /BEGIN_SCORECARD\s*([\s\S]*?)\s*END_SCORECARD/i,
  );

  return match?.[1]?.trim() ?? null;
}

function getScorecardAliases(category: ScoreCategory) {
  const snakeKey = category.key.replace(/([A-Z])/g, "_$1");

  return [
    category.key,
    category.key.replace(/([A-Z])/g, " $1"),
    snakeKey,
    category.label,
    ...category.aliases,
  ].map(normalizeScorecardKey);
}

function extractScorecardValue(scorecardBlock: string, acceptedKeys: string[]) {
  const lines = scorecardBlock.split(/\r?\n/).map(normalizeScoreLine);

  for (const line of lines) {
    const match = line.match(
      /^\s*([A-Za-z0-9_/&_\-\s]+?)\s*(?::|=|-)\s*(\d{1,3})(?:\s*\/\s*100|\s*%)?\s*$/i,
    );

    if (!match?.[1] || !match[2]) {
      continue;
    }

    const key = normalizeScorecardKey(match[1]);

    if (acceptedKeys.includes(key)) {
      return clampScore(Number(match[2]));
    }
  }

  return undefined;
}

function extractCategoryScore(scorecardBlock: string, category: ScoreCategory) {
  return extractScorecardValue(scorecardBlock, getScorecardAliases(category));
}

export function extractScores(responseText: string) {
  const scorecardBlock = extractScorecardBlock(responseText);

  if (!scorecardBlock) {
    return null;
  }

  return SCORE_CATEGORIES.reduce<ScoreMap>((scores, category) => {
    const score = extractCategoryScore(scorecardBlock, category);

    if (score !== undefined) {
      scores[category.key] = score;
    }

    return scores;
  }, {});
}

export function extractAiReportedScore(responseText: string) {
  const scorecardBlock = extractScorecardBlock(responseText);

  if (!scorecardBlock) {
    return null;
  }

  return (
    extractScorecardValue(scorecardBlock, [
      "final weighted score",
      "final weightedscore",
    ]) ?? null
  );
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

export function getTotalScoreWeight() {
  return Object.values(SCORE_WEIGHTS).reduce((total, weight) => total + weight, 0);
}

export function calculateWeightedScoreStats(scores: ScoreMap) {
  const weightedTotal = getWeightedScoreBreakdown(scores).reduce(
    (total, item) => total + item.weightedValue,
    0,
  );
  const totalWeight = getTotalScoreWeight();
  const normalizedScore = totalWeight > 0 ? weightedTotal / totalWeight : 0;

  return {
    totalWeight,
    weightedTotal,
    normalizedScore,
  };
}

export function calculateOverallScore(scores: ScoreMap) {
  const { normalizedScore } = calculateWeightedScoreStats(scores);

  return Math.round(normalizedScore);
}

function getMissingScoreLabels(scores: ScoreMap) {
  return SCORE_CATEGORIES.filter(
    (category) => scores[category.key] === undefined,
  ).map((category) => category.label);
}

export function analyzeResponse(responseText: string) {
  const scorecardBlock = extractScorecardBlock(responseText);

  if (!scorecardBlock) {
    throw new ScoreValidationError(
      "Scorecard block missing. Please include BEGIN_SCORECARD and END_SCORECARD in the AI output.",
      {},
      null,
      0,
    );
  }

  const scores = extractScores(responseText) ?? {};
  const aiReportedScore = extractAiReportedScore(responseText);
  const weightedBreakdown = getWeightedScoreBreakdown(scores);
  const weightedScoreStats = calculateWeightedScoreStats(scores);
  const calculatedScore = Math.round(weightedScoreStats.normalizedScore);
  const missingScoreLabels = getMissingScoreLabels(scores);

  logAnalysisDebug("[analysis] scorecard block", scorecardBlock);
  logAnalysisDebug("[analysis] parsed categories", scores);
  tableAnalysisDebug(weightedBreakdown);
  logAnalysisDebug("[analysis] totalWeight", weightedScoreStats.totalWeight);
  logAnalysisDebug("[analysis] weightedTotal", weightedScoreStats.weightedTotal);
  logAnalysisDebug(
    "[analysis] normalizedScore",
    weightedScoreStats.normalizedScore,
  );
  logAnalysisDebug("[analysis] calculated score", calculatedScore);
  logAnalysisDebug("[analysis] AI reported score", aiReportedScore);

  if (missingScoreLabels.length > 0) {
    throw new ScoreValidationError(
      `Scorecard is missing category scores: ${missingScoreLabels.join(", ")}.`,
      scores,
      aiReportedScore,
      calculatedScore,
    );
  }

  if (aiReportedScore === null) {
    throw new ScoreValidationError(
      "FINAL_WEIGHTED_SCORE was not found in the scorecard block.",
      scores,
      aiReportedScore,
      calculatedScore,
    );
  }

  if (Math.abs(aiReportedScore - calculatedScore) > 1) {
    throw new ScoreValidationError(
      "Score mismatch detected. The AI-generated weighted score does not match calculated values. Please regenerate the analysis without editing the output.",
      scores,
      aiReportedScore,
      calculatedScore,
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
