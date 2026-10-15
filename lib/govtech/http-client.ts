/**
 * Minimal typed HTTP client for browser-safe GovTech calls.
 *
 * Provides timeout via AbortController and consistent error shaping. Never logs
 * request bodies, tokens, or personal data.
 */

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class TimeoutError extends Error {
  constructor(message = "The request timed out.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  /** Timeout in ms. Defaults to 15s. */
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function httpRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", headers = {}, body, timeoutMs = 15000, signal } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // Chain an external abort signal if provided.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
      signal: controller.signal,
    });

    const text = await res.text();
    let parsed: unknown = undefined;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      throw new HttpError(res.status, `Request failed with status ${res.status}`, parsed);
    }
    return parsed as T;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError();
    }
    // Network/CORS/DNS failures land here. Avoid leaking details.
    throw new HttpError(0, "Network request failed. The service may be unreachable from the browser.");
  } finally {
    clearTimeout(timeout);
  }
}
