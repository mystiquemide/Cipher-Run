const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

async function callAI(prompt: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://cipher-run.vercel.app',
      'X-Title': 'Cipher Run'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000
    })
  });
  const data = await response.json();
  console.log('OpenRouter response:', JSON.stringify(data).slice(0, 200));
  if (!data.choices || !data.choices[0]) {
  console.error('OpenRouter unexpected response:', JSON.stringify(data));
  throw new Error(data.error?.message || 'OpenRouter returned no choices');
}
return data.choices[0].message.content;
```

This will log the actual response so we can see what OpenRouter is sending back.

**After committing, open the browser console (F12) on cipher-run.vercel.app, run a simulation, and tell me what the console prints for:**
```
OpenRouter response:
OpenRouter unexpected response:
}

export async function simulateScenario(
  trigger_event: string,
  data_feed: string,
  condition_logic: string,
  outcome: string,
  network: string,
  txHash?: string
) {
  const prompt = `You are a Rialo protocol simulation engine. Rialo is a next-generation blockchain with native real-world data feeds, sub-second finality, oracle-free pricing, and reactive smart contract execution. Simulate this scenario. Trigger: ${trigger_event}. Data Feed: ${data_feed}. Condition: ${condition_logic}. Outcome: ${outcome}. Network: ${network}.${txHash ? ` This simulation was recorded on-chain with transaction hash: ${txHash}.` : ''} Return ONLY a valid JSON object with exactly these keys: trigger_timestamp (ISO timestamp string), oracle_confirmation_count (integer between 9 and 12), latency_ms (integer between 180 and 800), gas_estimate_eth (string like 0.0031), outcome_status (one of EXECUTED PENDING or FAILED), narrative (2 to 3 sentence string explaining what happened referencing Rialo capabilities and the tx hash if provided), tweet_draft (tweet under 280 characters no emojis with #Rialo hashtag). Return ONLY the JSON. No markdown. No backticks. No explanation.`;

  const rawText = await callAI(prompt);
  const cleanText = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanText);
}

export async function validateIdea(
  idea_title: string,
  description: string,
  domain: string,
  data_sources: string,
  desired_outcome: string
) {
  const prompt = `You are a Web3 product feasibility analyst with deep expertise in the Rialo protocol. Rialo is a blockchain with native oracle-free data feeds, reactive smart contracts, webcall integration, sub-second finality, and autonomous workflow execution. Analyze the submitted idea and return ONLY a valid JSON object with exactly these keys: feasibility_score (integer 0-100), required_rialo_feeds (array of strings), suggested_trigger_logic (string in plain pseudo-code style), edge_cases (array of max 4 strings), estimated_latency_range (string like 4 to 9 minutes end-to-end), recommendation (honest 2-3 sentence verdict string), tweet_draft (tweet under 280 characters with idea title feasibility score and #Rialo hashtag no emojis). Return ONLY the JSON. No markdown. No backticks. No explanation. Title: ${idea_title}. Description: ${description}. Domain: ${domain}. Expected data sources: ${data_sources}. Desired outcome: ${desired_outcome}.`;

  const rawText = await callAI(prompt);
  const cleanText = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanText);
}
