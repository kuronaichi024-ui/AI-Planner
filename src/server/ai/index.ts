/**
 * AI orchestration module.
 *
 * Coordinates LLM providers (Mock, Anthropic, OpenAI), manages prompt assembly,
 * runs the interview turn pipeline, and handles AI safety boundaries.
 *
 * This module NEVER writes to the database directly. It returns validated ops
 * that flow through `server/brain` and then to `commit_brain` via `server/db`.
 */
export {};
