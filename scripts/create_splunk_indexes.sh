#!/usr/bin/env bash
# Create EventShield indexes in local Splunk (admin / EventShield1!)
set -euo pipefail

SPLUNK_URL="${SPLUNK_URL:-https://localhost:8089}"
SPLUNK_USER="${SPLUNK_USER:-admin}"
SPLUNK_PASS="${SPLUNK_PASS:-EventShield1!}"

INDEXES=(
  eventshield_network
  eventshield_ticketing
  eventshield_transport
  eventshield_gate_ops
  eventshield_crowd
  eventshield_workflow
  eventshield_incidents
)

echo "Waiting for Splunk management port..."
for i in $(seq 1 60); do
  if curl -sk -u "${SPLUNK_USER}:${SPLUNK_PASS}" "${SPLUNK_URL}/services/server/info" >/dev/null 2>&1; then
    echo "Splunk management is up."
    break
  fi
  sleep 5
  if [[ "$i" -eq 60 ]]; then
    echo "Timed out waiting for Splunk on ${SPLUNK_URL}"
    exit 1
  fi
done

for idx in "${INDEXES[@]}"; do
  echo "Ensuring index: ${idx}"
  curl -sk -u "${SPLUNK_USER}:${SPLUNK_PASS}" \
    "${SPLUNK_URL}/services/data/indexes" \
    -d name="${idx}" \
    -d datatype=event \
    >/dev/null || true
done

echo "Indexes ready."
curl -sk -u "${SPLUNK_USER}:${SPLUNK_PASS}" \
  "${SPLUNK_URL}/services/data/indexes?output_mode=json" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('\n'.join(sorted(e['name'] for e in d.get('entry',[]) if e['name'].startswith('eventshield_'))))"
