export type QuestionType = "rating" | "text" | "select" | "nps" | "keywords";

export interface SurveyQuestion {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  maxKeywords?: number;
  placeholder?: string;
}

// 事前アンケートは廃止
export const preSurveyQuestions: SurveyQuestion[] = [];

export const postSurveyQuestions: SurveyQuestion[] = [
  {
    id: "q1_satisfaction",
    label: "今回参加した満足度について教えてください",
    type: "rating",
    required: true,
    min: 1,
    max: 5,
  },
  {
    id: "q2_keywords",
    label: "印象に残ったキーワードについて教えてください",
    type: "keywords",
    required: false,
    maxKeywords: 5,
    placeholder: "キーワードを入力してEnterで追加",
  },
  {
    id: "q3_message",
    label: "講師へのメッセージをお願いします",
    type: "text",
    required: false,
    placeholder: "ご自由にお書きください",
  },
];
