// ponytail: belongs in @app/shared with the BE's POST /feedback schema; local until that package has it.
export interface NewFeedbackInput {
  message: string;
  /** Route the user was on, so the GitHub issue has context. */
  page: string;
}
