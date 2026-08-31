# Phase 6A — Cloud Ollama Infrastructure Preparation

## 1. Current Architecture vs Proposed
- **Current**: Local Node.js Backend directly accesses Local CPU-bound Ollama at `http://localhost:11434`. This works for development but is unsuitable and unreachable for cloud deployments (Render/Vercel).
- **Proposed Production**: Web/Mobile clients -> Render Backend -> Authenticated HTTPS connection -> Dedicated Cloud GPU server (e.g. RunPod) running Ollama + Qwen3.5:9b.

## 2. Infrastructure Provider Candidate
- **Provider**: RunPod
- **Recommended Instances**: NVIDIA RTX 4090 24GB (~$0.34/hr) or NVIDIA L4 24GB (~$0.44/hr). 24GB VRAM is ample for `qwen3.5:9b`.
- **Cost Estimate**:
  - Hourly: ~$0.34
  - 4 hours/day (Testing): ~$40.80/month
  - 8 hours/day: ~$81.60/month
  - 24/7 (Always On): ~$245.00/month
- *Status: No purchases have been made.*

## 3. Security Design
- The public cloud GPU endpoint must **never** expose an unauthenticated Ollama API (`11434`).
- A Nginx reverse proxy will act as a gateway, exposing standard ports (80/443).
- **Authentication**: Nginx will enforce a `Bearer` token check. 
- **Backend Setup**: `aiProvider.ts` has been modified to automatically inject an `Authorization: Bearer <OLLAMA_API_KEY>` header if configured in the environment.

## 4. Docker & Deployment Configuration
Created the `ollama-deployment/` directory containing:
1. `docker-compose.yml`: Deploys Ollama with Nvidia runtime capabilities and an Nginx sidecar container. Keeps models loaded in memory (`OLLAMA_KEEP_ALIVE=24h`).
2. `nginx.conf`: Restricts access to `/api/generate`, enforces Bearer token validation, adds rate-limiting, and configures long HTTP timeouts to prevent reverse-proxy timeouts during complex inferences.

## 5. Render Configuration (Environment Variables)
For Render, the following variables will be provisioned in the dashboard (never hardcoded):
```env
AI_PROVIDER=ollama
OLLAMA_URL=https://<your-runpod-id>.proxy.runpod.net
OLLAMA_MODEL=qwen3.5:9b
OLLAMA_API_KEY=<secure-generated-token>
```
Local development remains untouched and strictly utilizes `http://localhost:11434` without an API key.

## 6. Performance Benchmarking Strategy
Created `backend/scripts/benchmark.ts` to empirically measure latency improvements once the GPU is deployed. It measures:
- Cold start vs Warm model responses.
- Real-world AI Advisor agricultural prompts.
- Consecutive execution limits.
- Concurrent execution isolation.
*We will not assume a 2-5 second latency until this benchmark is run against the active GPU.*

## 7. Status Summary
- **Local Ollama**: PASS
- **Production Ollama**: BLOCKED (Awaiting user approval and RunPod provisioning)
- **Infrastructure Preparation**: PASS
