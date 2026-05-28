export type ScoreKey =
  | "problemSolving"
  | "brainstorming"
  | "researchSkill"
  | "learningSpeed"
  | "analyticalThinking"
  | "creativity"
  | "technicalThinking"
  | "communicationClarity"
  | "decisionMaking"
  | "adaptability"
  | "curiosityInitiative"
  | "selfCorrection"
  | "planningExecution"
  | "persistence"
  | "promptQuality";

export type ScoreMap = Partial<Record<ScoreKey, number>>;

export type ScoreCategory = {
  key: ScoreKey;
  label: string;
  aliases: string[];
  weight: number;
};

export type LeaderboardEntry = {
  username: string;
  averageScore: number;
  submissionCount: number;
};
