export type ScoreKey =
  | "problemSolving"
  | "creativity"
  | "learningSpeed"
  | "analyticalThinking"
  | "researchSkill"
  | "communicationClarity";

export type ScoreMap = Partial<Record<ScoreKey, number>>;

export type ScoreCategory = {
  key: ScoreKey;
  label: string;
  aliases: string[];
  weight: number;
};

export type LeaderboardEntry = {
  username: string;
  overallScore: number;
};
