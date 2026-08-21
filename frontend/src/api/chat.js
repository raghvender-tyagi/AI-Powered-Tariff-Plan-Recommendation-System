import { http, call } from './client';

/**
 * The advisor lives entirely in the backend: slot-filling, RAG retrieval over
 * the project's own artefacts, and — once the profile is complete — the same
 * recommendation engine every other screen uses.
 */

// POST /api/chat/start -> { sessionId, reply }
export const startChat = (customerId) => call(() => http.post('/chat/start', { customerId }));

// POST /api/chat/message { sessionId, message } -> { reply, profile, plans, sources }
export const sendChatMessage = (sessionId, message, customerId = null) =>
  call(() => http.post('/chat/message', { sessionId, message, customerId }));

// POST /api/rag/ask — one-shot grounded question answering
export const askKnowledgeBase = (question) => call(() => http.post('/rag/ask', { question }));

// GET /api/rag/search — raw semantic search over the knowledge base
export const searchKnowledgeBase = (query, limit = 5) =>
  call(() => http.get('/rag/search', { params: { q: query, limit } }));
