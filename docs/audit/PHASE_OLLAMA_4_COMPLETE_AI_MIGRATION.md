# Phase Ollama 4 — Complete AI Migration

## 1. Old AI Architecture
- **Web/Mobile**: Depended on backend endpoints.
- **Backend**: Handled Advisor by directly calling `@google/genai` (Gemini API). Handled translation/search by forwarding requests to an external Python `ai_service` on port `8000`.
- **Python AI Service**: Used `google-generativeai` to fulfill backend requests.

## 2. New AI Architecture
- **Web/Mobile**: Same (depends on backend).
- **Backend**: Uses a unified `AIProviderService` that strictly forwards all queries to the local Ollama instance (`localhost:11434`) running `qwen3.5:9b`.
- **Python AI Service**: Removed.
- **Gemini**: Removed.

## 3. Gemini Removal
- Uninstalled `@google/genai` via `npm uninstall`.
- Removed `GEMINI_API_KEY` from `.env.example`, environment validation config, and any deployment documentation.
- Hard-deleted legacy Gemini testing scripts (`gemini_live_test.js`, etc.).
- Stripped all Gemini references from `aiProvider.ts`.

## 4. Python AI Service Removal
- Verified the `ai_service` directory was entirely unused following Phase 3 routing changes.
- Physically deleted the entire `ai_service` tree and its dependencies from the repository.
- Removed startup routines for the AI service in `scripts/run-all.bat`.

## 5. Ollama Configuration & Qwen Model
- **Provider**: `AI_PROVIDER=ollama`
- **URL**: `OLLAMA_URL=http://localhost:11434`
- **Model**: `OLLAMA_MODEL=qwen3.5:9b`
- **Configuration**: Kept strictly as environment variables, with localhost references strictly confined to local development `.env` configs.

## 6. AI Features Tested
- **AI Advisor**: Functional. Extracts agricultural intent flawlessly.
- **Listing Translation**: Functional. Translated titles and descriptions synchronously.
- **Search Intent**: Functional. Isolated user keywords accurately.
- **Recommendations**: Functional. Returned structured JSON based on local backend data.
*(Verified in Phase 3 tests and architecture checks).*

## 7. Security Results
- Scanned for `GEMINI_API_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, etc.
- No production secrets are exposed. The `.env` file remains tracked out (`.gitignore`).
- `localhost:11434` is correctly abstracted by the backend and completely invisible to web/mobile clients.

## 8. Build Results
- **Backend**: `npx tsc --noEmit && npm run build` -> PASS (0 errors)
- **Web**: `npx tsc --noEmit && npm run build` -> PASS (0 errors)
- **Mobile**: `flutter analyze && flutter test` -> PASS

## 9. Performance
- Current local CPU-bound inference takes ~50–60+ seconds per query.
- The web and mobile apps successfully display loading states and do not freeze.
- The Node backend leverages a `300000ms` HTTP timeout to absorb these hardware limitations gracefully.

## 10. Production Limitations & Safety
**CRITICAL CLOUD RULE:**
`http://localhost:11434` must **never** be copied into cloud providers like Vercel or Render.
- In production, `OLLAMA_URL` must point to a secure, public-facing cloud GPU server running Ollama. 
- Ngrok or unauthenticated public localhost tunnels are prohibited for security reasons.

## 11. Remaining Issues
- **Hardware constraints**: Ollama inference is functional but exceptionally slow on standard developer machines. Production deployment strictly requires external compute acceleration.
- **Documentation**: Historical QA and audit documents referencing Gemini remain intact as evidence of previous migrations, as instructed.
