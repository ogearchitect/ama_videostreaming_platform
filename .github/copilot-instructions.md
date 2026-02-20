# Copilot Instructions for AMA Video Streaming Platform

## Project snapshot (what exists today)
- Backend is implemented in `src/` as a FastAPI API-first service; there is no frontend app directory yet.
- Core Azure integrations are already wired: Blob Storage, Video Indexer (CMAF preset), Synapse Analytics, Front Door.
- Infrastructure-as-code exists in both `infrastructure/terraform/` and `infrastructure/bicep/`.
- Tests are comprehensive in `tests/` (API, services, config, logging), mostly with mocks and async pytest.

## Architecture and data flow
- Entrypoint is `src/main.py`; routers are mounted from `src/api/videos.py` and `src/api/analytics.py`.
- Upload flow: `POST /api/videos/upload` -> `BlobStorageService.upload_video()` -> store metadata in in-memory `videos_db` + `SynapseAnalyticsService.insert_video()`.
- Indexing flow: `POST /api/videos/{id}/index` uses FastAPI `BackgroundTasks`, calls `VideoIndexerService.upload_video()`, tracks `indexer_mapping`, updates Synapse status.
- Insights flow: `GET /api/videos/{id}/insights` pulls Video Indexer insights, persists keywords/topics/transcript to Synapse, updates status to `indexed`.
- Delivery flow: `FrontDoorService.get_cdn_url()` rewrites blob URLs when endpoint is configured; otherwise falls back to blob URL.

## Conventions to preserve
- Keep service classes as singleton module instances (`*_service = ...`) in `src/services/*.py`.
- Keep API handlers thin: orchestrate service calls and model transformations; avoid embedding Azure SDK logic in routers.
- Maintain structured logging using `src/utils/logging.py` helpers (`log_azure_operation`, `azure_logger.log_metric`).
- Preserve async signatures in API/service methods even where sync SDK calls are used internally.
- Keep response shapes aligned with `src/models/video.py` Pydantic models.
- Current persistence is intentionally mixed: in-memory (`videos_db`, `indexer_mapping`) + Synapse tables; do not assume full DB-only state yet.

## Dev workflows (use these first)
- Setup: `python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
- Run API locally: `uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload`
- Run all tests: `pytest tests/ -v`
- Run focused tests: `pytest tests/test_video_indexer_service.py -v`
- Coverage: `pytest tests/ --cov=src --cov-report=html`
- Docker run path uses `Dockerfile` with ODBC dependencies for Synapse (`msodbcsql17`, `pyodbc`).

## Integration points and external dependencies
- Blob Storage: `azure-storage-blob`; container defaults to `videos` from `src/config.py`.
- Video Indexer: REST calls via `requests` in `src/services/video_indexer.py`; uses `AZURE_VIDEO_INDEXER_STREAMING_PRESET` (`Default` enables CMAF).
- Synapse: `pyodbc` connection string from env; schema bootstrap in `infrastructure/synapse_sql_scripts.sql` and runtime `initialize_tables()`.
- Front Door: URL translation + cache policy only (not full provisioning logic) in `src/services/front_door.py`.
- Monitoring: optional App Insights wiring in `src/main.py` + `src/utils/logging.py` (`opencensus-ext-azure`).

## Current gaps and next-stack guidance
- Frontend is planned (see `project plan/frontend-specification-v2-skill-aligned.md`) but not implemented; place it as a separate app (recommended: `web/`) without changing backend business logic.
- Agentic AI/Microsoft Foundry is not implemented yet; add as new bounded services/modules (e.g., `src/services/agent_*.py`) and keep API contracts explicit.
- If adding Foundry workflows, avoid coupling them to existing upload/index endpoints; introduce dedicated routes and typed models first.
- Before replacing in-memory stores, update tests that currently validate empty/ephemeral behavior in `tests/test_api.py` and `tests/test_analytics_api.py`.

## When changing code
- Prefer small, vertical updates (router + service + model + tests together).
- Mock external Azure calls in tests (pattern already established with `unittest.mock.patch`).
- Keep env-driven config in `src/config.py` and `.env.example`; do not hardcode credentials or endpoints.
