type TokenGetter = () => Promise<string | null>;

let getter: TokenGetter = async () => null;

/** Wired once by <ClerkTokenBridge> so the plain `api` client can attach the session JWT. */
export function setAuthTokenGetter(fn: TokenGetter): void {
  getter = fn;
}

export function getAuthToken(): Promise<string | null> {
  return getter();
}
