export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ROLES = ["USER", "ASSISTANT"] as const;
export type Role = (typeof ROLES)[number];

export const UPLOAD_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "ERROR"] as const;
export type UploadStatus = (typeof UPLOAD_STATUSES)[number];
