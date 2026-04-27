const DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173";

interface ICorsEnvironment {
  CORS_ORIGINS?: string;
  CORS_ORIGIN?: string;
}

export function getAllowedCorsOrigins(environment: ICorsEnvironment): Set<string> {
  const rawAllowedOrigins = environment.CORS_ORIGINS || environment.CORS_ORIGIN || DEFAULT_CORS_ORIGINS;

  return new Set(
    rawAllowedOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}
