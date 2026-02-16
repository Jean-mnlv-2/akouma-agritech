type Summary = {
  count: number;
  sum: number;
};

const requestsTotal = {
  name: 'akouma_requests_total',
  help: 'Total number of HTTP requests processed',
};

const requestDurationMs = {
  name: 'akouma_request_duration_ms',
  help: 'Total duration of HTTP requests in milliseconds',
};

const state = {
  requests: 0,
  durations: { count: 0, sum: 0 } as Summary,
};

export function recordRequest(durationMs: number) {
  state.requests += 1;
  state.durations.count += 1;
  state.durations.sum += durationMs;
}

export function renderPrometheusMetrics(): string {
  const lines: string[] = [];
  lines.push(`# HELP ${requestsTotal.name} ${requestsTotal.help}`);
  lines.push(`# TYPE ${requestsTotal.name} counter`);
  lines.push(`${requestsTotal.name} ${state.requests}`);
  lines.push(`# HELP ${requestDurationMs.name} ${requestDurationMs.help}`);
  lines.push(`# TYPE ${requestDurationMs.name} summary`);
  lines.push(`${requestDurationMs.name}_count ${state.durations.count}`);
  lines.push(`${requestDurationMs.name}_sum ${state.durations.sum}`);
  return lines.join('\n');
}

