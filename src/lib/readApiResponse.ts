function formatHttpStatus(response: Response): string {
  const statusText = response.statusText.trim();

  return statusText.length > 0 ? `${response.status} ${statusText}` : String(response.status);
}

function summarizeResponseBody(responseText: string): string {
  const normalizedText = responseText.replace(/\s+/g, " ").trim();

  if (normalizedText.length <= 160) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, 157)}...`;
}

function isLikelyJsonResponse(contentType: string, responseText: string): boolean {
  const trimmedResponseText = responseText.trimStart();

  return (
    contentType.includes("application/json") ||
    trimmedResponseText.startsWith("{") ||
    trimmedResponseText.startsWith("[")
  );
}

function isLikelyHtmlResponse(responseText: string): boolean {
  const trimmedResponseText = responseText.trimStart().toLowerCase();

  return (
    trimmedResponseText.startsWith("<!doctype html") ||
    trimmedResponseText.startsWith("<html") ||
    trimmedResponseText.startsWith("<head") ||
    trimmedResponseText.startsWith("<body")
  );
}

export async function readApiResponse<T>(response: Response, requestPath: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text();
  const httpStatus = formatHttpStatus(response);

  if (responseText.length === 0) {
    throw new Error(`Received an empty response from ${requestPath} (HTTP ${httpStatus}).`);
  }

  if (isLikelyJsonResponse(contentType, responseText)) {
    try {
      return JSON.parse(responseText);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown JSON parse failure";
      throw new Error(`Received invalid JSON from ${requestPath} (HTTP ${httpStatus}): ${errorMessage}`, {
        cause: error,
      });
    }
  }

  if (isLikelyHtmlResponse(responseText)) {
    throw new Error(
      `Received HTML instead of JSON from ${requestPath} (HTTP ${httpStatus}). This usually means the frontend reached the app server instead of the API. Start \`bun dev:all\` or set \`VITE_API_BASE_URL\` to the API origin.`,
    );
  }

  throw new Error(
    `Received a non-JSON response from ${requestPath} (HTTP ${httpStatus}): ${summarizeResponseBody(responseText)}`,
  );
}
