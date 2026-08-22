export const LANGUAGES = ["php", "typescript", "python", "java"] as const;

export type Language = (typeof LANGUAGES)[number];

export const TASK_IDS = [
  "request-dto",
  "request-mapper",
  "external-api",
  "response-dto",
] as const;

export type TaskId = (typeof TASK_IDS)[number];

export type TaskProgress = {
  completed: boolean;
  /**
   * The participant's own text. Only meaningful once `touched` is true; while
   * untouched the editor shows the current track's starter code instead.
   */
  draft: string;
  /** True once the participant has edited this task in the current track. */
  touched: boolean;
  hintsUsed: number;
};

export type WorkshopState = {
  version: number;
  language: Language | null;
  tasks: Record<TaskId, TaskProgress>;
  quizCompleted: boolean;
};
