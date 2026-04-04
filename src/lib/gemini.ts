export async function simulateScenario(
  trigger_event: string,
  data_feed: string,
  condition_logic: string,
  outcome: string,
  network: string,
  txHash?: string
) {
  const response = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger_event, data_feed, condition_logic, outcome, network, txHash })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Simulation failed');
  }
  return response.json();
}

export async function validateIdea(
  idea_title: string,
  description: string,
  domain: string,
  data_sources: string,
  desired_outcome: string
) {
  const response = await fetch('/api/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea_title, description, domain, data_sources, desired_outcome })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Validation failed');
  }
  return response.json();
}
