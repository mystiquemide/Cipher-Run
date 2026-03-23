import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function simulateScenario(
  trigger_event: string,
  data_feed: string,
  condition_logic: string,
  outcome: string,
  network: string,
  txHash?: string
) {
  const prompt = `You are a Rialo protocol simulation engine. Rialo is a next-generation blockchain with native real-world data feeds, sub-second finality, oracle-free pricing, and reactive smart contract execution. Simulate this scenario. Trigger: ${trigger_event}. Data Feed: ${data_feed}. Condition: ${condition_logic}. Outcome: ${outcome}. Network: ${network}.${txHash ? ` This simulation was recorded on-chain with transaction hash: ${txHash}.` : ''} Return ONLY a valid JSON object with exactly these keys: trigger_timestamp (ISO timestamp string), oracle_confirmation_count (integer between 9 and 12), latency_ms (integer between 180 and 800), gas_estimate_eth (string like 0.0031), outcome_status (one of EXECUTED PENDING or FAILED), narrative (2 to 3 sentence string explaining what happened referencing Rialo capabilities and the tx hash if provided), tweet_draft (tweet under 280 characters no emojis with #Rialo hashtag). Return ONLY the JSON. No markdown. No backticks. No explanation.`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
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

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
  const cleanText = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanText);
}
