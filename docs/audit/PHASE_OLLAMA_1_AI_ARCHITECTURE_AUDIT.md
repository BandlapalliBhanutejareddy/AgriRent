# Phase Ollama 1 — AI Architecture Audit

## 1. Current AI Architecture
The AgroRent platform currently employs a split AI architecture:
- **Node.js/Express Backend**: Handles the main AI Advisor chat endpoint (`/api/ai/advisor`). It communicates directly with the Google Gemini API using the `@google/genai` Node SDK.
- **Python/FastAPI Service (`ai_service`)**: A standalone microservice running on port 8000. It handles secondary AI tasks like equipment recommendations, search intent parsing, and listing translations. The Node backend communicates with this Python service via HTTP (`axios`).
- **Frontend Clients (Web & Mobile)**: Never communicate directly with AI providers. They route all requests through the Node backend.

## 2. AI Features Found
1. **AI Advisor (Chat)**: Found in `web/src/app/dashboard/ai-advisor/page.tsx`, `mobile/lib/features/ai_advisor/ui/ai_advisor_screen.dart`, and `backend/src/routes/ai.ts`.
2. **Search Intent Parsing**: Found in `backend/src/routes/equipment.ts`, which sends search strings to `ai_service/main.py` (`/search-intent`) to extract English keywords from regional language queries.
3. **Listing Translation**: Found in `backend/src/routes/equipment.ts` and `backend/scripts/migrate_translations.ts`, which sends equipment titles/descriptions to `ai_service/main.py` (`/translate-listing`) to automatically translate them into Te, Hi, Ta, Kn.
4. **Equipment Recommendations**: Defined in `ai_service/main.py` (`/recommend-equipment`), providing tailored machinery suggestions based on crop and soil inputs.

## 3. Current External AI Providers
- **Google Gemini API**: Utilized across the entire platform. 
- Node backend uses `@google/genai`.
- Python service uses `google-generativeai`.
- Model versions targeted: `gemini-2.5-flash`, `gemini-1.5-flash`.

## 4. Current API Endpoints
- `POST /api/ai/advisor` (Node Backend)
- `POST /search-intent` (Python AI Service)
- `POST /translate-listing` (Python AI Service)
- `POST /recommend-equipment` (Python AI Service)

## 5. Current Prompt Flow
- **AI Advisor**: User input (prompt & language) + Database Equipment List -> Node Backend (`backend/src/routes/ai.ts`) -> Formatted Context Prompt -> Google Gemini API -> Markdown Response.
- **Search Intent / Translation**: Backend `equipment.ts` -> Python `ai_service` -> Formatted Prompt -> Google Gemini API -> JSON/Keyword Response -> Node Backend.

## 6. Current Web Flow
`web/src/app/dashboard/ai-advisor/page.tsx` captures user form data (Crop, Soil, Acreage, Question) -> sends to `api.post('/ai/advisor')` -> displays response via `ReactMarkdown`.

## 7. Current Mobile Flow
`mobile/lib/features/ai_advisor/ui/ai_advisor_screen.dart` captures query -> `aiProvider` -> `POST /api/ai/advisor` -> renders response via `flutter_markdown`.

## 8. Current Backend Flow
`backend/src/routes/ai.ts` checks for `GEMINI_API_KEY`. It fetches the list of available equipment from the database using Prisma. It formats a highly contextual prompt enforcing the user's selected language and queries `@google/genai`. Responses and errors are logged using `prisma.auditLog`.

## 9. Ollama Compatibility
**PASS**. The current architecture is well-suited for Ollama. The Web and Mobile applications do not need to know which AI provider is being used because the Node backend completely abstracts it. We can simply replace the `@google/genai` calls in the backend with standard HTTP `POST` requests (using native `fetch` or `axios`) pointing to Ollama's local `/api/generate` endpoint. 

## 10. qwen3.5:9b Compatibility
**YES**. `qwen3.5:9b` is highly capable of following instructions, outputting structured JSON (crucial for translations), generating markdown, and handling Indian regional languages. 

## 11. Development Architecture
**A. Local Development:**
Web/Mobile -> Backend (Node on `localhost:4000`) -> Ollama REST API (`localhost:11434` with `qwen3.5:9b`).
The Python `ai_service` can be deprecated by absorbing its logic directly into the Node backend, vastly simplifying the architecture.

## 12. Production Architecture
**WARNING - NOT POSSIBLE TO ROUTE CLOUD TO LOCAL SECURELY FOR PRODUCTION**
If the Backend is hosted on **Render** and Web is on **Vercel**, they exist in the public cloud. They **cannot** access `localhost:11434` on your local Windows PC without a reverse proxy/tunnel (like Ngrok or Cloudflare Tunnels). 
Even with a tunnel, using a local Windows PC for production is dangerous:
- If the PC goes to sleep, the production app crashes/fails.
- Tunnel URLs change frequently unless paid.
- Single PC cannot handle concurrent production load.

**Correct Future Options:**
- **Local Development**: Backend -> localhost Ollama
- **Production**: Backend -> Cloud GPU Hosted Ollama (e.g., RunPod, AWS EC2) OR Hybrid (Backend -> Gemini for production, Ollama for local dev).

## 13. Security Findings
- **PASS**: No API keys are sent to frontend clients.
- **PASS**: User inputs are abstracted through backend routes.
- **PASS**: AI does not have write access to the database or authorization systems; it acts purely as a recommendation engine.

## 14. Performance Findings
- **Latency**: Local inference with `qwen3.5:9b` will have higher time-to-first-token compared to Gemini. The Web/Mobile UI currently uses loading spinners (`isLoading`), but long generation times might trigger default Axios/browser timeouts.
- **Concurrency**: Ollama queues requests sequentially by default. Multiple simultaneous users could cause high wait times.

## 15. Failure Handling
The current system checks for missing Gemini keys and returns a `503 Unavailable` status, gracefully handled by Web/Mobile (shows a fallback UI). When migrating to Ollama, the backend must use `try/catch` around the HTTP call to gracefully handle network errors (`ECONNREFUSED`) if the Ollama service is stopped, ensuring it doesn't crash the Node server.

## 16. Language Support
The AI Advisor supports English, Telugu, Tamil, Hindi, and Kannada. The prompt explicitly instructs the AI to respond in the selected language. `qwen3.5:9b` will need this explicit instruction to ensure it doesn't default to English or Romanized text.

## 17. Dependencies That May Become Unnecessary
- `@google/genai` (Node backend).
- The entire `ai_service` Python directory and its dependencies (`google-generativeai`, `fastapi`, `uvicorn`).

## 18. Files That Will Need Modification in Phase 2
- `backend/src/routes/ai.ts` (Replace Gemini with direct Ollama HTTP call)
- `backend/src/routes/equipment.ts` (Absorb Python logic and point to Ollama)
- `backend/.env.example` / `backend/.env` (Add `OLLAMA_URL=http://localhost:11434`)
- `backend/package.json` (Remove `@google/genai`)

## 19. Files That Must NOT Be Modified
- `web/src/app/dashboard/ai-advisor/page.tsx`
- `mobile/lib/features/ai_advisor/ui/ai_advisor_screen.dart`
- Any business logic routes (`bookings.ts`, `payments.ts`, `auth.ts`)
- Database Schema (`prisma/schema.prisma`)

## 20. Migration Plan
1. Centralize AI calls in the Node Backend (deprecate Python service).
2. Configure Node backend to make standard HTTP `POST` requests to `http://localhost:11434/api/generate`.
3. Update prompts slightly to match optimal `qwen3.5:9b` formatting.
4. Implement strict timeout and error catching for local Ollama unavailability.
5. Remove Google Gemini dependencies.

## 21. Risks
- Higher latency during AI response generation.
- Production deployment will require purchasing a cloud GPU if replacing Gemini entirely in production.
- Potential degradation in translation accuracy for complex regional dialects compared to Google's specialized models.

## 22. Phase 1 Test Results
- Repository successfully scanned.
- All AI touchpoints successfully identified.
- Safe path forward formulated without modifying production logic.
