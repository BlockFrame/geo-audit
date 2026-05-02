# Vercel Analytics Setup for GEO Audit Agent

## Overview

Vercel Web Analytics is integrated in the frontend to track:

1. Performance metrics (automatic)
- Page views and navigation paths
- Core Web Vitals (LCP, INP/FID, CLS)
- Page load timing

2. Custom events (application)
- Audit lifecycle: started, completed, failed
- Export interactions: download, mode changes, audience changes
- Chat interactions: message sent, refusal triggered
- Report viewing events

## Installation

1. Install dependencies

```bash
cd frontend
npm install
```

2. Verify package entries in package.json

```json
{
  "@vercel/analytics": "^1.2.2",
  "@vercel/speed-insights": "^1.0.11"
}
```

3. Verify app/layout.tsx includes Analytics and SpeedInsights

```tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

<Analytics />
<SpeedInsights />
```

## Vercel Configuration

### Prerequisites
- Project deployed on Vercel
- Vercel CLI installed (`npm i -g vercel`)

### Deploy

```bash
vercel deploy --prod
```

### Enable Analytics in Vercel Dashboard

1. Open https://vercel.com/dashboard
2. Select the project
3. Open Analytics > Web Analytics
4. Confirm analytics is enabled

## Tracked Events

### Audit

- `audit_started`: triggered when a user starts an audit
  - Properties: `url` (hostname only)
- `audit_completed`: triggered when an audit completes
  - Properties: `url`, `business_type`, `geo_score`, `status`, `duration_ms`
- `audit_failed`: triggered when an audit fails
  - Properties: `error_type`, `url`

### Export

- `export_downloaded`: triggered when a report is downloaded
  - Properties: `format`, `mode`, `audience`, `geo_score`
- `export_mode_changed`: triggered when export mode changes
  - Properties: `mode`
- `export_audience_changed`: triggered when export audience changes
  - Properties: `audience`

### Chat

- `chat_message_sent`: triggered when a user sends a message
  - Properties: `message_length`
- `chat_refusal_triggered`: triggered when a refusal guardrail is hit
  - Properties: `reason_type`

### Report

- `report_viewed`: triggered when the dashboard report is rendered
  - Properties: `report_type`

## Privacy and Data Handling

Not tracked:
- Full URLs (only hostname)
- Sensitive chat content
- Third-party cookies
- Raw IP-level profiling in app events

Tracked:
- Hostname under analysis
- Aggregate score/status values
- Product interaction events
- High-level error categories

## Debugging

Check analytics availability in browser console:

```js
console.log(window.va)
window.va?.track("manual_test", { ok: true })
```

If events are missing in dashboard:
1. Wait 5-10 minutes for ingestion
2. Confirm traffic is from Vercel deployment (not localhost)
3. Verify Analytics is enabled in project settings

## References

- Vercel Analytics docs: https://vercel.com/docs/analytics
- Web Analytics guide: https://vercel.com/docs/analytics/web
- Vercel REST API: https://vercel.com/docs/rest-api
