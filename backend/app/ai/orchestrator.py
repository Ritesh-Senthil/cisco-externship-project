"""LLM orchestrator with OpenAI-compatible API and Ollama wiring + canned fallback."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings
from app.models.schemas import AiQuestionResponse, ReadinessSnapshot
from app.scenario.world import runtime

logger = logging.getLogger("eventshield.ai")


FALLBACK_ANSWERS: dict[str, str] = {
    "why are we not ready?": (
        "Gate 1 is conditional because several dependencies are simultaneously marginal: "
        "17/20 scanners online, elevated wireless utilization, unverified backup path, "
        "screening staff below plan, and an inbound Amtrak wave. No single source is a hard "
        "failure — the risk is the combination."
    ),
    "what should we fix first?": (
        "Prioritize the three highest-leverage, low-risk actions: move two mobile scanners "
        "to Gate 1, verify backup wireless failover, and assign two screening staff. That "
        "restores admission, network resilience, and security capacity before opening."
    ),
    "what happens if we open now?": (
        "Opening now keeps the fair in CONDITIONAL OPEN. If the Amtrak arrival hits while "
        "Gate 1 is still marginal, queue wait is likely to climb quickly and create a "
        "localized entry bottleneck — even though Etix cloud health is normal."
    ),
    "which team owns each blocker?": (
        "Scanner coverage: Gate Ops. Backup wireless verification: Network Ops. Screening "
        "staffing: Security Ops. Transit wave awareness: Transit Liaison / Fair Ops."
    ),
    "what is causing the gate 1 delay?": (
        "A localized capacity collapse: Amtrak and a GoRaleigh shuttle arrived nearly "
        "together, one screening lane closed, wireless utilization spiked above 90%, and "
        "scanner validation success fell below 80%. Etix remains healthy."
    ),
    "is etix down?": (
        "No. Etix external health checks are normal. This is a Gate 1 local capacity and "
        "connectivity problem, not a systemwide ticketing outage."
    ),
    "what is the fastest safe response?": (
        "Approve the ranked playbook: switch scanners to backup connectivity, prioritize "
        "validation traffic, reopen the screening lane, add staff, redirect the next shuttle "
        "to the alternate east gate, update signage, and open the Webex incident room."
    ),
    "why redirect the shuttle?": (
        "Redirecting the shuttle cuts Gate 1 arrival pressure immediately while wireless and "
        "scanner recovery are still in progress. The alternate east gate is ready and can "
        "absorb overflow without closing Gate 1."
    ),
    "what happens if we do nothing?": (
        "Queue length and predicted wait continue rising, scanner timeouts persist under "
        "wireless congestion, and Gate 1 remains a localized bottleneck until demand "
        "naturally falls — which is too slow for fair opening operations."
    ),
    "did the response work?": (
        "Yes. After approval, synthetic metrics show scanner success recovering, queue and "
        "wait declining, and wireless utilization falling. The incident moved to resolved."
    ),
    "are we ready?": (
        "Check the readiness score and status chip. READY TO OPEN means weighted dependencies "
        "cleared thresholds with confidence. CONDITIONAL OPEN means cascading risk remains."
    ),
}


def _normalize(q: str) -> str:
    return " ".join(q.lower().strip().rstrip("?").split()) + "?"


def fallback_answer(question: str, readiness: ReadinessSnapshot) -> AiQuestionResponse:
    key = _normalize(question)
    # fuzzy contains match
    answer = None
    for k, v in FALLBACK_ANSWERS.items():
        if k.rstrip("?") in key.rstrip("?") or key.rstrip("?") in k.rstrip("?"):
            answer = v
            break
    if not answer:
        answer = (
            f"Based on current evidence: status {readiness.status.value}, score "
            f"{readiness.score:.0f}. {readiness.insight}"
        )
    return AiQuestionResponse(
        answer=answer,
        source="fallback",
        evidence_refs=[r.title for r in readiness.top_risks],
        confidence=readiness.confidence.lower(),
    )


def _build_context(question: str, readiness: ReadinessSnapshot, incident: dict[str, Any] | None) -> str:
    # Imported here to avoid a circular import at module load time.
    from app.engines.intelligence import incident_plan, preopening_plan
    from app.models.schemas import ScenarioPhase

    facts = [
        f"Phase: {runtime.phase.value}",
        f"Status: {readiness.status.value}",
        f"Score: {readiness.score}",
        f"Insight: {readiness.insight}",
        f"Scanners: {readiness.gate.scanners_online}/{readiness.gate.scanners_total}",
        f"Validation success: {readiness.gate.validation_success}%",
        f"Wi-Fi: {readiness.gate.wifi_utilization}%",
        f"Backup verified: {readiness.gate.backup_path_verified}",
        f"Screening lanes: {readiness.gate.screening_lanes_open}/{readiness.gate.screening_lanes_total}",
        f"Staffing: {readiness.gate.staffing_status}",
        f"Etix healthy: {readiness.gate.etix_healthy}",
        f"Queue: {readiness.forecast.queue_estimate}",
        f"Predicted wait: {readiness.forecast.predicted_wait_min} min",
        f"Amtrak delay: {readiness.gate.amtrak_delay_min} min, passengers {readiness.gate.amtrak_passengers}",
        f"Shuttle destination: {readiness.gate.shuttle_destination}",
    ]

    # Current blockers/risks so the model can answer "why not ready / top risks".
    for risk in readiness.top_risks:
        facts.append(f"Blocker: {risk.title} — {risk.summary}")

    # Recommended actions WITH their owning team, so ownership questions are answerable.
    if runtime.phase in {ScenarioPhase.INCIDENT, ScenarioPhase.RECOVERING, ScenarioPhase.RESOLVED}:
        plan = incident_plan()
    else:
        plan = preopening_plan()
    for a in plan.actions:
        facts.append(
            f"Recommended action '{a.title}' — owner: {a.owner}; impact: {a.expected_impact}"
        )

    if incident:
        facts.append(f"Incident: {incident.get('title')} ({incident.get('state')})")
        facts.append(f"Cause: {incident.get('likely_cause')}")

    return (
        "You are EventShield, Cisco's operations assistant for the N.C. State Fair "
        "operations team. Speak as a live production system about fair readiness, gates, "
        "and operations. NEVER refer to a demo, simulation, test, sample, or scenario, "
        "and never mention that any data is simulated — treat everything as real, current "
        "operations. Answer ONLY using the provided facts. Do not invent metrics, "
        "thresholds, or team names. When asked who owns a blocker or action, use the "
        "'owner' listed on the recommended actions. Be concise (4-6 sentences), plain "
        "language, status-first.\n\n"
        f"FACTS:\n- " + "\n- ".join(facts) + f"\n\nQUESTION: {question}"
    )


async def ask_llm(question: str, readiness: ReadinessSnapshot, incident: dict[str, Any] | None) -> AiQuestionResponse:
    settings = get_settings()
    # Presenter toggle: when AI fallback is ON, always use canned answers (demo-safe).
    if runtime.ai_fallback:
        return fallback_answer(question, readiness)

    prompt = _build_context(question, readiness, incident)
    try:
        if settings.llm_provider == "ollama":
            text = await _ollama(prompt, settings.llm_model, settings.ollama_base_url, settings.llm_timeout_seconds)
        else:
            text = await _openai(
                prompt,
                settings.llm_model,
                settings.openai_base_url,
                settings.openai_api_key,
                settings.llm_timeout_seconds,
            )
        return AiQuestionResponse(
            answer=text.strip(),
            source="llm",
            evidence_refs=[r.title for r in readiness.top_risks],
            confidence=readiness.confidence.lower(),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM failed, using fallback: %s", exc)
        fb = fallback_answer(question, readiness)
        fb.answer = fb.answer + "\n\n(Live model unavailable — canned explanation shown.)"
        return fb


async def _ollama(prompt: str, model: str, base_url: str, timeout: float) -> str:
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            f"{base_url.rstrip('/')}/api/generate",
            # keep_alive keeps the model resident so we don't pay the ~10s cold-start
            # penalty on a live answer during the demo.
            json={"model": model, "prompt": prompt, "stream": False, "keep_alive": "30m"},
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("response") or data.get("message", {}).get("content") or ""


async def warmup() -> None:
    """Best-effort: load the Ollama model into memory so the first real question is warm.

    Never raises — if Ollama isn't running or the provider is OpenAI, this is a no-op.
    """
    settings = get_settings()
    if settings.llm_provider != "ollama":
        return
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            await client.post(
                f"{settings.ollama_base_url.rstrip('/')}/api/generate",
                json={
                    "model": settings.llm_model,
                    "prompt": "ok",
                    "stream": False,
                    "keep_alive": "30m",
                },
            )
        logger.info("Ollama model '%s' warmed up.", settings.llm_model)
    except Exception as exc:  # noqa: BLE001
        logger.info("Ollama warmup skipped (%s).", exc)


async def _openai(prompt: str, model: str, base_url: str, api_key: str, timeout: float) -> str:
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            f"{base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "You explain EventShield evidence. Never invent data."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
