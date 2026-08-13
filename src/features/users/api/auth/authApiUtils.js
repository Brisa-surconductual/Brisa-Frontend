export function createApiError(
  message,
  code,
  originalError = null,
) {
  const error = new Error(message);

  error.code = code;
  error.status = originalError?.status ?? null;
  error.originalError = originalError;

  return error;
}

export function hasApiStatus(error, ...statuses) {
  return statuses.includes(error?.status);
}

export function apiErrorMessageIncludes(error, ...values) {
  const message = String(
    error?.data?.message ??
      error?.message ??
      '',
  ).toLowerCase();

  return values.some((value) =>
    message.includes(value.toLowerCase()),
  );
}