module.exports.mapProviderError = function mapProviderError(e) {
  const code = e?.response?.data?.code ?? e?.status ?? e?.response?.status ?? null;
  const msg  = e?.response?.data?.msg  ?? e?.message ?? 'Unknown error';

  if (code === 429) return { type: 'INSUFFICIENT_CREDITS', message: msg, retryable: true };
  if (code === 401) return { type: 'BAD_API_KEY', message: 'Invalid or missing API key', retryable: false };
  if (code === 403) return { type: 'FORBIDDEN', message: 'Account does not have access', retryable: false };
  if (code === 400) return { type: 'BAD_REQUEST', message: msg, retryable: false };
  if (code === 408 || code === 504) return { type: 'TIMEOUT', message: 'Provider timed out', retryable: true };
  if (e?.kind === 'NO_JOB_ID') return { type: 'NO_JOB_ID', message: 'Provider did not return a job id', retryable: true };
  return { type: 'GEN_ERROR', message: msg, retryable: true };
};
