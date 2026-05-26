# RootCauseX — Implementation Plan

---

# Phase 1 — Runtime World

## Goal

Create a fake production environment.

## Deliverables

- frontend React setup
- backend Spring Boot setup
- metrics cards
- dependency graph
- healthy runtime dashboard
- mock runtime data

## Visible Outcome

A healthy production system is visible.

---

# Phase 2 — Drift Detection

## Goal

Detect abnormal runtime behavior.

## Deliverables

- drift detection engine
- incident trigger flow
- degraded services
- anomaly alerts
- runtime state transitions

## Visible Outcome

Dashboard reacts dynamically to incidents.

---

# Phase 3 — Runtime Context

## Goal

Show system evolution over time.

## Deliverables

- deployments feed
- commit history
- timeline visualization
- chronology tracking

## Visible Outcome

Incident gains historical context.

---

# Phase 4 — AI Investigation Workflows

## Goal

Enable contextual AI-native investigation triggered directly from runtime anomalies.

## Architecture

NOT a generic chatbot. NOT ChatGPT inside a dashboard.

AI is embedded into the runtime system:
- "Investigate" button attached to each anomaly card
- Platform auto-gathers full runtime context before Claude responds
- Claude generates a structured RCA report automatically
- Follow-up conversational chat opens after the RCA

## Deliverables

Backend:
- InvestigationContextService — aggregates full runtime context bundle
- InvestigationService — Claude API integration + structured prompt builder
- InvestigationController — POST /investigate (streams response via SSE)

Frontend:
- AnomalyFeed.jsx — add "Investigate" button to each anomaly card
- InvestigationPanel.jsx — side panel: anomaly context + streaming RCA + follow-up chat
- App.jsx — add investigatingAnomaly state
- api/client.js — add postInvestigate with SSE streaming support

## RCA Response Structure

Claude must respond in this format:
1. Probable Root Cause
2. Affected Systems
3. Propagation Path
4. Supporting Evidence
5. Correlated Deployments
6. Recommended Next Investigation

## Visible Outcome

Developer clicks "Investigate" on an anomaly.
AI instantly generates a structured RCA report with evidence.
Developer follows up in chat to dig deeper.

---

# Phase 5 — AI Cognition Experience

## Goal

Make AI feel intelligent.

## Deliverables

- cognition stream
- streaming investigation flow
- animated graph highlighting
- live reasoning visualization

## Visible Outcome

The system feels alive and AI-native.

---

# Phase 6 — Demo Experience

## Goal

Polish the end-to-end experience.

## Deliverables

- scripted incident flow
- smooth transitions
- guided investigation experience
- presentation polish

## Visible Outcome

A cinematic hackathon demo experience.
