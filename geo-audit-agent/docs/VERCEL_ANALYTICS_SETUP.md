# Vercel Analytics Setup for GEO Audit Agent

## Panoramica

Vercel Web Analytics è integrato nel frontend per tracciare:

1. **Performance Metrics** (automatico)
   - Page views e navigazione
   - Vitals (LCP, FID, CLS)
   - Tempi di caricamento

2. **Custom Events** (applicazione)
   - Audit lifecycle: start, complete, failed
   - Export: download, mode/audience selection
   - Chat: messaggi e refusals
   - Report viewing

## Installazione

1. **Installa dipendenze**
```bash
cd frontend
npm install
```

2. **Verifica package.json**
```json
{
  "@vercel/analytics": "^1.2.2",
  "@vercel/speed-insights": "^1.0.11"
}
```

3. **Check layout.tsx**
```tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// In RootLayout:
<Analytics />
<SpeedInsights />
```

## Configurazione Vercel

### Prerequisiti
- Progetto deployato su Vercel
- Vercel CLI installato: `npm i -g vercel`

### Deployment

```bash
# Dalla cartella frontend/
vercel deploy --prod
```

### Abilitare Analytics nel dashboard Vercel

1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto
3. Vai su "Analytics" → "Web Analytics"
4. Verifica che sia abilitato (default: ON)

### Environment Variables

Nel Vercel dashboard, aggiungi:
```
OPENROUTER_API_KEY = your-key
OPENROUTER_BASE_URL = https://openrouter.ai/api/v1
OPENROUTER_MODEL = openrouter/free
```

## Events Tracciati

### Audit Events

**audit_started**
- Quando: Utente avvia audit
- Properties: `url` (dominio solo)

**audit_completed**
- Quando: Audit termina con successo
- Properties:
  - `url`: dominio
  - `business_type`: tipo di business rilevato
  - `geo_score`: score finale (0-100)
  - `status`: "strong" | "moderate" | "at_risk"
  - `duration_ms`: tempo di esecuzione

**audit_failed**
- Quando: Audit fallisce
- Properties:
  - `error_type`: categorizzazione errore
  - `url`: dominio

### Export Events

**export_downloaded**
- Quando: Utente scarica report
- Properties:
  - `format`: "md" | "pdf"
  - `mode`: "verbose" | "executive" | "checklist"
  - `audience`: "executive" | "marketing" | "technical"
  - `geo_score`: score del report

**export_mode_changed**
- Quando: Utente cambia modalità report
- Properties: `mode`

**export_audience_changed**
- Quando: Utente cambia audience
- Properties: `audience`

### Chat Events

**chat_message_sent**
- Quando: Utente invia messaggio Copilot
- Properties: `message_length` (caratteri)

**chat_refusal_triggered**
- Quando: Sistema rifiuta richiesta
- Properties: `reason_type` (categorizzazione)

### Report Events

**report_viewed**
- Quando: Report visualizzato in dashboard
- Properties: `report_type` ("full_dashboard")

## Viewing Analytics

### Vercel Dashboard
https://vercel.com → Project → Analytics → Web Analytics

**Metriche disponibili:**
- Page views per URL
- Top pages
- Visitor count
- Core Web Vitals
- Custom events (tab "Events")

### Local Development

Nel browser console, verifica logging:
```js
window.va.track("test_event", { test: true })
```

Output in console:
```
[Analytics Event] test_event { test: true }
```

## Privacy & Data Handling

### Enti di dati

❌ **Non tracciamo:**
- URL completi (solo dominio)
- Contenuto chat sensibile
- IP addresses
- Cookies di terzi

✅ **Tracciamo:**
- Dominio analizzato (es: `example.com`)
- Score range (es: "strong", "moderate")
- Azioni dell'utente (format, mode, audience)
- Performance metrics
- Error types (categorizzati)

### Conformità GDPR

- ✅ No cookies di tracciamento (Analytics usa pixel)
- ✅ Dati aggregati, non personali
- ✅ Niente IP tracking
- ✅ Retenzione: 30 giorni (Vercel default)

Se richiesto consenso: implementare banner prima di `<Analytics />`

## Debugging

### Verificare installazione

```bash
# Controlla che @vercel/analytics sia installato
npm list @vercel/analytics

# Build e test in produzione locale
npm run build
npm start

# Vai su http://localhost:3000
# Apri DevTools → Network → filtra "vitals"
```

### Verifica events

Nel DevTools Console:
```js
// Check if Vercel Analytics is loaded
console.log(window.va)

// Manual test
window.va?.track("manual_test", { foo: "bar" })
```

### Troubleshooting

**Events non compaiono in Vercel dashboard**
1. Aspetta 5-10 minuti per sync
2. Verifica che il progetto sia deployato su Vercel (non localhost)
3. Controlla che Analytics sia abilitato in Vercel → Project Settings

**Speed Insights non funzionano**
1. Verifica `@vercel/speed-insights` in package.json
2. Riavvia `npm run dev`
3. Controlla DevTools → Performance → Web Vitals

**Warning "window.va is undefined"**
- Normal in development se non sei su Vercel
- Viene caricato solo da Vercel infrastructure
- Fallback a console.log in dev mode

## Prossimi Step (opzionali)

### GA4 Integration
Se vuoi anche Google Analytics:

```tsx
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
```

### Custom Dashboard
```bash
npm install react-charts
# Query Vercel API per visualizzare dati custom
```

### Backend Telemetry
Nel backend Python:
```python
import logging

logging.info(f"Audit started for {domain}", extra={
    "event_type": "audit_started",
    "url": domain
})
```

## Supporto Vercel

- Docs: https://vercel.com/docs/analytics
- Web Analytics Guide: https://vercel.com/docs/analytics/web
- API Reference: https://vercel.com/docs/rest-api
