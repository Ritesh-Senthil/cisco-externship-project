"""REST + WebSocket API."""

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder

from app.ai.orchestrator import ask_llm
from app.engines.intelligence import evaluate_readiness, incident_plan, preopening_plan
from app.engines.snapshot import build_snapshot
from app.integrations.store import store
from app.models.schemas import AiQuestionRequest
from app.scenario import controller
from app.scenario.world import runtime

router = APIRouter()


class Hub:
    def __init__(self) -> None:
        self.clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self.clients.add(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self.clients.discard(ws)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        data = json.dumps(jsonable_encoder(payload))
        async with self._lock:
            clients = list(self.clients)
        dead: list[WebSocket] = []
        for ws in clients:
            try:
                await ws.send_text(data)
            except Exception:  # noqa: BLE001
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)


hub = Hub()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "eventshield"}


@router.get("/persistence")
async def persistence() -> Any:
    """Evidence that Postgres/Redis are really wired (best-effort integration)."""
    return await store.health()


@router.get("/readiness")
async def readiness() -> Any:
    return evaluate_readiness()


@router.get("/snapshot")
async def snapshot() -> Any:
    return build_snapshot()


@router.get("/incidents")
async def incidents() -> Any:
    snap = build_snapshot()
    return [snap.active_incident] if snap.active_incident else []


@router.get("/incidents/{incident_id}")
async def incident_detail(incident_id: str) -> Any:
    snap = build_snapshot()
    if snap.active_incident and snap.active_incident.id == incident_id:
        return snap.active_incident
    return {"error": "not_found"}


@router.get("/evidence/{incident_id}")
async def evidence(incident_id: str) -> Any:
    snap = build_snapshot()
    inc = snap.active_incident
    return {
        "incidentId": incident_id,
        "evidence": inc.evidence if inc else [],
        "recentEvents": snap.recent_events[:30],
        "domainScores": snap.readiness.domain_scores,
        "forecast": snap.readiness.forecast,
        "dependencies": [
            "Etix Validation",
            "Scanner Fleet",
            "Gate 1 Wireless",
            "Screening Lanes",
            "Gate Staff",
            "Crowd Queue Capacity",
            "Amtrak Arrival Demand",
            "GoRaleigh Arrival Demand",
            "Alternate East Gate",
            "Digital Signage",
        ],
    }


@router.get("/plans/preopening")
async def plans_preopening() -> Any:
    return preopening_plan()


@router.get("/plans/incident")
async def plans_incident() -> Any:
    return incident_plan()


@router.post("/ai/question")
async def ai_question(body: AiQuestionRequest) -> Any:
    snap = build_snapshot()
    incident = snap.active_incident.model_dump() if snap.active_incident else None
    resp = await ask_llm(body.question, snap.readiness, incident)
    await store.log_ai(body.question, resp.source, resp.confidence, resp.answer)
    return resp


@router.post("/actions/preopening/approve")
async def approve_preopening() -> Any:
    result = controller.apply_readiness_fixes()
    await store.log_action(runtime.phase.value, "plan_preopen_gate1", "approved")
    return result


@router.post("/actions/preopening/reject")
async def reject_preopening() -> Any:
    controller._add_timeline("Plan rejected", "Pre-opening plan rejected.", "action")
    await store.log_action(runtime.phase.value, "plan_preopen_gate1", "rejected")
    return {"ok": True, "rejected": True}


@router.post("/actions/incident/approve")
async def approve_incident() -> Any:
    result = controller.approve_recovery()
    await store.log_action(runtime.phase.value, "plan_gate1_incident", "approved")
    return result


@router.post("/actions/incident/reject")
async def reject_incident() -> Any:
    result = controller.reject_plan()
    await store.log_action(runtime.phase.value, "plan_gate1_incident", "rejected")
    return result


@router.post("/admin/{action}")
async def admin_action(action: str) -> Any:
    fn = controller.ADMIN_ACTIONS.get(action)
    if not fn:
        return {"ok": False, "error": f"unknown action: {action}"}
    result = fn()
    await store.log_action(runtime.phase.value, "admin", action)
    # Push immediate snapshot after presenter control (read-only; the tick advances smoothing)
    snap_json = build_snapshot().model_dump(mode="json")
    await hub.broadcast({"type": "snapshot", "data": snap_json})
    await store.publish_snapshot(snap_json)
    return result


@router.websocket("/stream")
async def stream(ws: WebSocket) -> None:
    await hub.connect(ws)
    try:
        await ws.send_text(
            json.dumps(
                jsonable_encoder({"type": "snapshot", "data": build_snapshot().model_dump(mode="json")})
            )
        )
        while True:
            # Keep alive; client may send pings
            try:
                await asyncio.wait_for(ws.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                await ws.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        await hub.disconnect(ws)
    except Exception:  # noqa: BLE001
        await hub.disconnect(ws)
