"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost, adminAction, WS_URL } from "@/lib/api";
import type { ResponsePlan, ScenarioSnapshot } from "@/lib/types";

export function useEventShield() {
  const [snapshot, setSnapshot] = useState<ScenarioSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [preopeningPlan, setPreopeningPlan] = useState<ResponsePlan | null>(null);
  const [aiAnswer, setAiAnswer] = useState<{ question: string; answer: string; source: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [view, setView] = useState<"command" | "gate" | "incident" | "timeline">("command");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [controllerOpen, setControllerOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const refresh = useCallback(async () => {
    const snap = await apiGet<ScenarioSnapshot>("/api/snapshot");
    setSnapshot(snap);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    let heartbeat: ReturnType<typeof setInterval> | undefined;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        if (!cancelled) setConnected(true);
        heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 20000);
      };
      ws.onclose = () => {
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = undefined;
        }
        if (!cancelled) {
          setConnected(false);
          retry = setTimeout(connect, 1500);
        }
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "ping") {
            ws.send("ping");
            return;
          }
          if (msg.type === "pong") return;
          if (msg.type === "snapshot" && msg.data) {
            setSnapshot(msg.data as ScenarioSnapshot);
          }
        } catch {
          /* ignore */
        }
      };
    };

    refresh().catch(() => undefined);
    apiGet<ResponsePlan>("/api/plans/preopening").then(setPreopeningPlan).catch(() => undefined);
    connect();

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      if (heartbeat) clearInterval(heartbeat);
      wsRef.current?.close();
    };
  }, [refresh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setControllerOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setEvidenceOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runAdmin = async (action: string) => {
    await adminAction(action);
    await refresh();
  };

  const ask = async (question: string) => {
    setAiLoading(true);
    try {
      const res = await apiPost<{ answer: string; source: string }>("/api/ai/question", { question });
      setAiAnswer({ question, answer: res.answer, source: res.source });
    } finally {
      setAiLoading(false);
    }
  };

  const approvePreopening = async () => {
    await apiPost("/api/actions/preopening/approve");
    await refresh();
  };

  const rejectPreopening = async () => {
    await apiPost("/api/actions/preopening/reject");
    await refresh();
  };

  const approveIncident = async () => {
    await apiPost("/api/actions/incident/approve");
    await refresh();
  };

  const rejectIncident = async () => {
    await apiPost("/api/actions/incident/reject");
    await refresh();
  };

  return {
    snapshot,
    connected,
    preopeningPlan,
    aiAnswer,
    aiLoading,
    view,
    setView,
    evidenceOpen,
    setEvidenceOpen,
    controllerOpen,
    setControllerOpen,
    runAdmin,
    ask,
    approvePreopening,
    rejectPreopening,
    approveIncident,
    rejectIncident,
  };
}
