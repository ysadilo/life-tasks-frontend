/** What the backend sends over Web Push and the service worker shows. */
export interface PushPayload {
  title: string;
  body: string;
  /** Collapses repeats of the same notification. */
  tag: string;
  /** Where a click lands. */
  url: string;
}
