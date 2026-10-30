/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN: string;
  readonly VITE_AUTH0_CLIENT_ID: string;
  readonly VITE_AUTH0_AUDIENCE: string;
  /** Public base URL of the avatar / board cover bucket, no trailing slash. */
  readonly VITE_IMAGES_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
