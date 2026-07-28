const NETWORK_DELAY_MS = 600;

export function simulateNetworkDelay(
  ms = NETWORK_DELAY_MS,
) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createApiError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}
