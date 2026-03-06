// Archived module: prompt count tracking (disabled)
// Status: abandoned for now in favor of token/limit telemetry only.

const PROMPT_COUNT_ARCHIVE = {
  uiIds: ['prompts-chatgpt', 'prompts-claude', 'prompts-kimi', 'total-prompts'],
  removedStorageField: 'aiUsage.{platform}.prompts',
  rationale: 'Prompt counts are noisy and less useful than token usage/limits for current product direction.'
};
