# GEO Audit Agent - Frontend

This is the Next.js frontend for the GEO Audit Agent - an AI-powered Generative Engine Optimization audit tool.

## Quick Start

### Prerequisites
- Node.js 20.x or later
- npm or yarn

### Installation
```bash
npm install
```

### Local Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

## Features

- 🎯 **Real-time GEO Audits** - Analyze website readiness for AI answer engines
- 💬 **Conversational Interface** - CopilotKit-powered chat for interactive analysis
- 📊 **Rich Dashboard** - View audit results, scores, and recommendations
- 📄 **Smart Export** - Generate business-oriented PDFs and Markdown reports
  - Multiple export modes: Verbose, Executive, Checklist
  - Audience-targeted content: Executive, Marketing, Technical
  - Customizable brand templates
- 📈 **Web Analytics** - Vercel Analytics + Speed Insights for monitoring

## Environment Variables

Create a `.env.local` file in this directory:

```env
# Backend bridge (server-side only)
BACKEND_URL=http://127.0.0.1:8000/copilotkit
BACKEND_AGUI_URL=http://127.0.0.1:8000/agui/default

# Public links (shown in UI)
NEXT_PUBLIC_DISCORD_URL=https://discord.com/invite/your-server
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/your-profile/
NEXT_PUBLIC_FEEDBACK_FORM_URL=https://your-feedback-form-url
```

For production (Vercel), set these in the [Vercel Dashboard](https://vercel.com/dashboard):

```env
BACKEND_URL=https://your-render-backend.onrender.com/copilotkit
BACKEND_AGUI_URL=https://your-render-backend.onrender.com/agui/default
NEXT_PUBLIC_DISCORD_URL=https://discord.com/invite/your-server
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/your-profile/
NEXT_PUBLIC_FEEDBACK_FORM_URL=https://your-feedback-form-url
```

## Architecture

### Key Components
- **AuditDashboardContent** - Main report view with all audit sections
- **ReportDownloads** - Export controls with template selection
- **CopilotKit Integration** - Conversational AI agent interface
- **Vercel Analytics** - Web analytics and custom event tracking

### State Management
- CopilotKit manages shared state between chat and dashboard
- Report state synchronized via the backend API
- Local component state for UI controls (export mode, audience, brand)

### Analytics Events Tracked
- `audit_completed` - When an audit finishes
- `export_downloaded` - When user exports a report
- `export_mode_changed` - Export mode selection
- `export_audience_changed` - Audience selection
- `chat_message_sent` - Copilot chat interaction
- `report_viewed` - Dashboard view events

See [Vercel Analytics Setup](../docs/VERCEL_ANALYTICS_SETUP.md) for details.

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Vercel auto-detects Next.js configuration
3. Set environment variables in Project Settings
4. Deploy with `vercel deploy --prod` or via GitHub push

Vercel automatically:
- ✅ Installs dependencies
- ✅ Builds Next.js app
- ✅ Enables Web Analytics
- ✅ Sets up speed monitoring

### Configuration Files
- `vercel.json` - Vercel-specific config (build commands, framework detection)
- `.env.local` - Local development environment variables
- `.env.local.example` - Template for environment setup
- `next.config.mjs` - Next.js configuration

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 14** | React framework with SSR/SSG |
| **React 18** | UI component library |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **CopilotKit** | Conversational AI integration |
| **pdf-lib** | PDF generation |
| **@vercel/analytics** | Web analytics |
| **@vercel/speed-insights** | Performance monitoring |

## File Structure

```
frontend/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes (bridges to backend)
│   ├── layout.tsx            # Root layout with Analytics
│   ├── page.tsx              # Main page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── ReportDownloads.tsx   # Export controls
│   ├── dashboard/            # Dashboard components
│   └── ...
├── lib/
│   ├── analytics.ts          # Analytics utilities
│   ├── report-export.ts      # Report generation
│   ├── types.ts              # TypeScript types
│   └── ...
├── public/                   # Static assets
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind config
├── next.config.mjs           # Next.js config
└── vercel.json               # Vercel deployment config
```

## Common Issues

### Backend Connection Error
- Check `BACKEND_URL` environment variable
- Verify backend is running (`curl https://backend-url/health`)
- Ensure CORS is configured on backend

### Build Errors
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 20.x)

### Analytics Not Tracking
- Wait 10 minutes for first data to sync
- Check browser console: `console.log(window.va)` should exist
- Verify on https://vercel.com → Project → Analytics

## Contributing

For changes to the audit logic, GEO scoring, or backend integration, see the root [GEO-AUDIT-APP README](../README.md).

## License

See LICENSE file in the project root.

## Support

- **Issues & Feedback**: Use the feedback form linked in the app footer
- **Documentation**: See [docs/](../docs/) for detailed guides
- **Backend Issues**: See [backend/README.md](../backend/README.md)

---

**Status**: Experimental  
**Version**: 0.1.0  
**Last Updated**: May 2026
