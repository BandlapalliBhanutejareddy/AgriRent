# Phase Ollama 2 — AI Provider Migration

## 1. Architecture Before
- Node backend queried `Google Gemini` via `@google/genai` directly for the AI Advisor.
- Node backend queried a separate Python FastAPI `ai_service` on port 8000 for Search Intent and Listing Translations.
- Python `ai_service` used `google-generativeai`.

## 2. Architecture After
- Node backend abstracts all AI calls through a unified `AIProviderService`.
- Python `ai_service` is no longer called by the Node backend (though the folder is intentionally preserved for now).
- The `AIProviderService` routes requests to either local `Ollama` or remote `Gemini` depending on the `AI_PROVIDER` environment variable.

## 3. AI Provider Interface
Created `AIProviderService` with standard methods:
- `getAdvisorAdvice(prompt, language, equipmentList)`
- `getSearchIntent(query)`
- `translateListing(title, description)`
- `getEquipmentRecommendations(crop, soilType, acreage)`

## 4. Ollama Provider
- Implemented using native `axios` POST to `${OLLAMA_URL}/api/generate`.
- Reads `OLLAMA_MODEL` dynamically.
- Gracefully throws an abstraction-level error if connection is refused or invalid JSON is returned.

## 5. Gemini Provider
- Preserved exactly as before, utilizing the existing `GEMINI_API_KEY`.
- Continues to be the default fallback when `AI_PROVIDER=gemini`.

## 6. Provider Selection
- Controlled by `AI_PROVIDER` in `backend/.env`.
- `AI_PROVIDER=ollama` routes to local inference.
- `AI_PROVIDER=gemini` keeps production pointing to Google.

## 7. AI Advisor Migration
- Migrated `backend/src/routes/ai.ts` to use `aiProvider.getAdvisorAdvice()`.
- Unchanged frontend endpoints and API contracts.

## 8. Search Intent Migration
- Migrated `backend/src/routes/equipment.ts` to use `aiProvider.getSearchIntent()`.
- Dropped the `axios` call to the Python `ai_service`.
- In case of failure, falls back cleanly to the literal string search.

## 9. Listing Translation Migration
- Migrated `backend/src/routes/equipment.ts` and `migrate_translations.ts` to use `aiProvider.translateListing()`.
- Dropped the `axios` call to the Python `ai_service`.

## 10. Equipment Recommendation Migration
- Migrated to `AIProviderService.getEquipmentRecommendations`.
- Fully supports structural JSON output required for frontend parsers.

## 11. Error Handling
- `AIProviderService` wraps Ollama and Gemini HTTP exceptions.
- Throws meaningful errors (`Local AI Provider (Ollama) unavailable or failed`).
- `backend/src/routes/ai.ts` catches this and returns `503 Service Unavailable`, preventing Express crash.

## 12. Security
- Repository scanned for secrets; only legitimate placeholder/development configurations found.
- No direct Web/Mobile access to Ollama (all routed securely through Backend).
- `GEMINI_API_KEY` remains securely handled in Node.js.

## 13. Local Ollama Test
- Tested via `test_ollama.ts` locally.
- Successfully routed the request to local Ollama API.

## 14. qwen3.5:9b Test
- Configured backend to specifically use `qwen3.5:9b` via `OLLAMA_MODEL` var.
- Responses correctly formatted in Markdown.

## 15. Failure Test
- Tested via `test_failure.ts` using an invalid port (`11435`).
- Failed gracefully with message `Local AI Provider (Ollama) unavailable or failed`, returning `503` over HTTP rather than crashing Node.

## 16. Production Safety
- `backend/.env.example` modified to show safe placeholder configs.
- Production environment (`Render`) will continue to use `gemini` since `AI_PROVIDER` defaults to `gemini` if not explicitly set to `ollama`.

## 17. Build Results
- **Backend Build**: PASS
- **Web Build**: FAIL (Due to unrelated `date-fns` missing module; not caused by AI migration, ignored per instructions).
- **Flutter Analyze / Test**: PASS (UI unaffected).

## 18. Files Changed
- `backend/src/services/aiProvider.ts` (CREATED)
- `backend/src/routes/ai.ts`
- `backend/src/routes/equipment.ts`
- `backend/scripts/migrate_translations.ts`
- `backend/.env.example`

## 19. Files NOT Deleted
- `ai_service/*`
- `@google/genai` dependency

## 20. Remaining Work for Phase 3
- Full migration and multi-language verification.
- Complete replacement of Gemini if production GPUs are procured.
- Safe deletion of the `ai_service` Python folder.
