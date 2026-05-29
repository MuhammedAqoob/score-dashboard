import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAdminLog } from "@/services/adminLogService";
import { CreatePromptInput, Prompt, PromptWithId } from "@/types/prompt";

const PROMPTS_COLLECTION = "prompts";
const ACTIVE_PROMPT_ID = "activePrompt";

export const DEFAULT_ACTIVE_PROMPT_TITLE =
  "AI Response Analysis Scorecard";

export const EXPECTED_SCORECARD_FORMAT = `BEGIN_SCORECARD

problem_solving: 78
brainstorming: 74
research_skill: 71
learning_speed: 75
analytical_thinking: 79
creativity: 70
technical_logical_thinking: 82
communication_clarity: 68
decision_making: 63
adaptability: 77
curiosity_initiative: 81
self_correction: 74
planning_execution: 69
persistence_consistency: 78
prompt_quality: 66

FINAL_WEIGHTED_SCORE: 75

END_SCORECARD`;

export const DEFAULT_ACTIVE_PROMPT_CONTENT = `You are evaluating a user's AI-assisted response quality.

Your output MUST begin with a strict machine-readable scorecard before any human-readable analysis.

CRITICAL SCORECARD RULES:
- Output BEGIN_SCORECARD as the first non-empty line.
- Output END_SCORECARD after FINAL_WEIGHTED_SCORE.
- Use one category per line.
- Use exact keys only.
- Use integer values only from 0 to 100.
- Do not use markdown tables inside the scorecard.
- Do not use bullet points inside the scorecard.
- Do not omit any category.
- Do not rename keys.
- Do not add extra keys inside the scorecard.
- FINAL_WEIGHTED_SCORE must use the weighted formula below.
- Do not estimate FINAL_WEIGHTED_SCORE manually.
- Do not use simple average scoring.

REQUIRED SCORECARD FORMAT:

${EXPECTED_SCORECARD_FORMAT}

WEIGHTS FOR FINAL_WEIGHTED_SCORE:
problem_solving = 15
analytical_thinking = 12
learning_speed = 10
research_skill = 10
brainstorming = 10
technical_logical_thinking = 10
communication_clarity = 8
adaptability = 7
self_correction = 7
planning_execution = 6
curiosity_initiative = 5
persistence_consistency = 5
creativity = 3
prompt_quality = 2

decision_making is for display and analysis only. Do not include decision_making in FINAL_WEIGHTED_SCORE.

CALCULATION RULE:
FINAL_WEIGHTED_SCORE =
(
(problem_solving * 15) +
(analytical_thinking * 12) +
(learning_speed * 10) +
(research_skill * 10) +
(brainstorming * 10) +
(technical_logical_thinking * 10) +
(communication_clarity * 8) +
(adaptability * 7) +
(self_correction * 7) +
(planning_execution * 6) +
(curiosity_initiative * 5) +
(persistence_consistency * 5) +
(creativity * 3) +
(prompt_quality * 2)
) / 110

Round only the final result to the nearest integer.

After END_SCORECARD, provide the human-readable analysis with:
1. Brief overall summary
2. Strengths
3. Weaknesses
4. Category-by-category notes
5. Concrete improvement suggestions

Remember: the scorecard must come first and must exactly match the required keys.`;

function getActivePromptRef() {
  return doc(db, PROMPTS_COLLECTION, ACTIVE_PROMPT_ID);
}

export async function fetchActivePrompt() {
  const activePromptSnap = await getDoc(getActivePromptRef());

  if (!activePromptSnap.exists()) {
    return {
      id: ACTIVE_PROMPT_ID,
      title: DEFAULT_ACTIVE_PROMPT_TITLE,
      content: DEFAULT_ACTIVE_PROMPT_CONTENT,
      version: 1,
    } satisfies PromptWithId;
  }

  return {
    id: activePromptSnap.id,
    ...(activePromptSnap.data() as Prompt),
  } satisfies PromptWithId;
}

export async function saveActivePrompt(input: CreatePromptInput) {
  const activePromptRef = getActivePromptRef();
  const activePromptSnap = await getDoc(activePromptRef);
  const title = input.title.trim();
  const content = input.content.trim();

  if (!title || !content) {
    throw new Error("Prompt title and content are required.");
  }

  await setDoc(
    activePromptRef,
    {
      title,
      content,
      version: input.version,
      createdAt:
        activePromptSnap.exists() && activePromptSnap.data().createdAt
          ? activePromptSnap.data().createdAt
          : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await createAdminLog({
    actionType: "prompt_update",
    targetUsername: "global_prompt",
    details: `Active prompt saved as version ${input.version}.`,
  });
}

export const createPrompt = saveActivePrompt;
