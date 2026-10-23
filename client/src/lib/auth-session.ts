
export type SessionUser = {
  id: string;
  username: string;
  email: string;
  roles: string[];
};

export type SessionResult =
  | { status: "authenticated"; user: SessionUser }
  | { status: "guest" }
  | { status: "unavailable" };

let refreshPromise: Promise<boolean> | null = null;

async function fetchCurrentUser(): Promise<SessionResult> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) {
      return { status: "guest" };
    }

    if (!response.ok) {
      return { status: "unavailable" };
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      !("authenticated" in data) ||
      data.authenticated !== true ||
      !("user" in data) ||
      !data.user ||
      typeof data.user !== "object"
    ) {
      return { status: "unavailable" };
    }

    const user = data.user as Record<string, unknown>;

    if (
      typeof user.id !== "string" ||
      typeof user.username !== "string" ||
      typeof user.email !== "string" ||
      !Array.isArray(user.roles) ||
      !user.roles.every(
        (role) => typeof role === "string"
      )
    ) {
      return { status: "unavailable" };
    }

    return {
      status: "authenticated",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles as string[],
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}

async function requestRefresh(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function performRefresh(): Promise<boolean> {
  /*
   * navigator.locks coordinates refresh attempts across
   * tabs on the same origin in supported browsers.
   *
   * After acquiring the lock, recheck the session:
   * another tab may already have rotated the token.
   */

  if (typeof navigator !== "undefined" &&
      "locks" in navigator) {
    try {
      return await navigator.locks.request(
        "crestmark-session-refresh",
        { mode: "exclusive" },
        async () => {
          const current = await fetchCurrentUser();

          if (current.status === "authenticated") {
            return true;
          }

          if (current.status === "unavailable") {
            return false;
          }

          return requestRefresh();
        }
      );
    } catch {
      return false;
    }
  }

  // Fallback for browsers without the Web Locks API.
  // Same-tab calls are still deduplicated below.
  const current = await fetchCurrentUser();

  if (current.status === "authenticated") {
    return true;
  }

  if (current.status === "unavailable") {
    return false;
  }

  return requestRefresh();
}

function refreshSessionOnce(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function getCurrentSession(): Promise<SessionResult> {
  const initial = await fetchCurrentUser();

  if (initial.status !== "guest") {
    return initial;
  }

  const refreshed = await refreshSessionOnce();

  if (!refreshed) {
    /*
     * Distinguish a genuinely expired session from
     * temporary backend errors where possible.
     */
    return fetchCurrentUser();
  }

  return fetchCurrentUser();
}

/**
 * Fetch protected GET endpoints.
 *
 * If the access token has expired, try to restore
 * the session and retry the request once.
 *
 * Returns the original 401 response if recovery fails.
 */
export async function authenticatedFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();

  if (method !== "GET") {
    throw new Error(
      "authenticatedFetch supports GET requests only."
    );
  }

  const options: RequestInit = {
    ...init,
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  };

  const response = await fetch(input, options);

  if (response.status !== 401) {
    return response;
  }

  // Refresh the session through the existing mechanism.
  const session = await getCurrentSession();

  if (session.status !== "authenticated") {
    return response;
  }

  // Retry only once after successful recovery.
  return fetch(input, options);
}
