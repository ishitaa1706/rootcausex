# RootCauseX

## Overview

RootCauseX is an AI-native runtime investigation platform.

The product helps engineers understand production anomalies using AI-powered runtime reasoning.

This is NOT:
- a monitoring dashboard
- a rollback system
- a log viewer
- a static code analysis tool

This IS:
- an AI-powered production investigation system
- a runtime intelligence layer
- a conversational debugging assistant

---

# Core Problem

Current AI coding assistants understand source code but lack production runtime context.

They cannot reason effectively about:
- latency drift
- retry amplification
- service degradation
- deployment impact
- dependency instability
- runtime anomalies
- production behavior

RootCauseX solves this by correlating:
- runtime metrics
- deployments
- git commits
- service topology
- traffic behavior
- dependency relationships

Then using AI to generate probable root-cause insights.

---

# MVP Goal

The MVP should demonstrate:

1. Runtime anomaly detection
2. Behavioral drift visualization
3. AI-powered runtime reasoning
4. Conversational investigation
5. Dependency-aware anomaly analysis

The system should FEEL like:
"AI understanding production systems."

---

# Demo Incident Story

Primary incident:

Every evening between 6–7 PM:
payment-service latency increases dramatically.

The underlying issue:
A retry policy introduced in auth-service v2.1
causes retry amplification during peak traffic.

This creates:
- downstream queue contention
- increased retries
- cascading service degradation

The AI should correlate:
- deployment history
- retry increases
- dependency behavior
- runtime drift

And explain the probable cause.

IMPORTANT:
Latency is only ONE example anomaly type.

The architecture should support:
- latency spikes
- retry amplification
- error bursts
- queue saturation
- dependency instability
- cascading failures
- unusual runtime behavior

---

# High-Level Architecture

Production Systems
    ↓
Runtime Signal Collection Layer
    ↓
Behavioral Baseline Engine
    ↓
Drift & Anomaly Detection
    ↓
Runtime Correlation Engine
    ↓
AI Reasoning Engine
    ↓
Conversational Investigation Layer
    ↓
AI-Native Runtime Dashboard

---

# Runtime World

## Services

- Auth Service
- Payment Service
- Order Service
- Inventory Service
- Notification Service

## Service Dependencies

Auth → Payment → Order

Inventory → Order

Notification → Order

---

# Runtime Signals

The platform simulates:
- latency
- retries
- error rates
- queue depth
- deployments
- commits
- dependency health
- runtime anomalies

All runtime data can be mock data.

No real infrastructure required.

---

# Tech Stack

## Frontend
- React
- Tailwind CSS
- React Flow
- Framer Motion

## Backend
- Spring Boot

## AI
- Claude API

---

# Backend Requirements

The backend should expose APIs for:

GET /services
GET /metrics
GET /deployments
GET /commits
POST /investigate

The backend should:
- simulate runtime behavior
- simulate anomalies
- expose runtime context
- perform drift detection
- prepare AI investigation context

No database required.

Use JSON files for mock runtime data.

---

# Frontend Requirements

The frontend should include:

1. Runtime Dashboard
2. Metrics Visualization
3. Dependency Graph
4. Drift Alerts
5. Incident Timeline
6. AI Investigation Panel
7. AI Cognition Stream

The UI should feel:
- cinematic
- futuristic
- AI-native
- observability-inspired

Use:
- dark theme
- glowing effects
- smooth transitions
- animated runtime states

---

# AI Investigation Flow

User asks:
"What happened?"
or
"Why is payment-service unstable?"

The backend gathers:
- runtime metrics
- deployments
- commits
- dependency relationships
- anomaly data

Then prepares structured investigation context.

Claude generates:
- runtime reasoning
- correlated anomalies
- probable root causes
- deployment impact insights

---

# MVP Scope

The MVP should include:

- fake runtime environment
- drift detection
- runtime dashboard
- dependency graph
- incident simulation
- AI investigation flow
- conversational debugging
- runtime reasoning

The MVP should NOT include:

- real observability integrations
- Kubernetes
- databases
- authentication
- microservices
- real telemetry ingestion
- real git integrations

Focus entirely on:
believable AI-native runtime reasoning.

---

# Success Criteria

The MVP succeeds if judges feel:

"Wow, this feels like AI actually understands production systems."

NOT:
"This is another monitoring dashboard."
