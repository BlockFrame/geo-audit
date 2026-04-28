"use client";

import { useEffect } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    locale?: "it" | "en";
};

// ─── Reusable sub-components ────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
        <h2 className="text-base font-semibold text-cyan-300 uppercase tracking-widest mb-4 border-b border-cyan-400/20 pb-2">
            {title}
        </h2>
        {children}
    </section>
);

const FormulaBox = ({ children }: { children: React.ReactNode }) => (
    <div className="my-3 rounded-xl border border-slate-600/40 bg-slate-900/60 px-4 py-3 font-mono text-xs text-cyan-200 leading-relaxed">
        {children}
    </div>
);

const WeightRow = ({
    label,
    weight,
    color,
    description,
}: {
    label: string;
    weight: string;
    color: string;
    description: string;
}) => (
    <div className="mb-3 rounded-xl border border-slate-700/40 bg-slate-800/40 p-4">
        <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-100">{label}</span>
            <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ background: `${color}22`, color }}
            >
                {weight}
            </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
);

const ScoreRange = ({
    color,
    range,
    label,
    meaning,
}: {
    color: string;
    range: string;
    label: string;
    meaning: string;
}) => (
    <div className="flex items-start gap-3 mb-2">
        <div className="mt-0.5 w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
        <div>
            <span className="text-xs font-semibold" style={{ color }}>
                {range} — {label}
            </span>
            <p className="text-xs text-slate-400">{meaning}</p>
        </div>
    </div>
);

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function MethodologyModal({ open, onClose, locale = "en" }: Props) {
    const it = locale === "it";

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={it ? "Metodologia di calcolo dei KPI" : "KPI Calculation Methodology"}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div className="relative z-10 my-8 mx-4 w-full max-w-3xl rounded-3xl border border-slate-600/40 bg-slate-900/95 shadow-2xl backdrop-blur-xl">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-700/50 bg-slate-900/90 px-6 py-4 backdrop-blur">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-100">
                            {it ? "Metodologia GEO Score" : "GEO Score Methodology"}
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {it
                                ? "Come vengono calcolati i KPI e perché questi pesi"
                                : "How KPIs are computed and why these weights"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-600/50 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                        aria-label={it ? "Chiudi" : "Close"}
                    >
                        {it ? "Chiudi" : "Close"} ✕
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 text-slate-300">

                    {/* ── 1. GEO Score complessivo ── */}
                    <Section title={it ? "1. GEO Score Complessivo" : "1. Overall GEO Score"}>
                        <p className="text-sm text-slate-400 mb-3">
                            {it
                                ? "Il GEO Score è una media ponderata di sei dimensioni che misurano la visibilità del sito web per i motori di ricerca basati su AI (ChatGPT Search, Perplexity, Google AI Overviews, Bing Copilot)."
                                : "The GEO Score is a weighted average of six dimensions measuring website visibility for AI-powered search engines (ChatGPT Search, Perplexity, Google AI Overviews, Bing Copilot)."}
                        </p>
                        <FormulaBox>
                            GEO Score =<br />
                            &nbsp;&nbsp;AI_Citability × 0.25<br />
                            &nbsp;+ Brand_Authority × 0.20<br />
                            &nbsp;+ Content_Quality × 0.20<br />
                            &nbsp;+ Technical_Foundations × 0.15<br />
                            &nbsp;+ Structured_Data × 0.10<br />
                            &nbsp;+ Platform_Optimization × 0.10
                        </FormulaBox>

                        <WeightRow
                            label={it ? "AI Citability & Visibility" : "AI Citability & Visibility"}
                            weight="25%"
                            color="#67e8f9"
                            description={it
                                ? "Peso maggiore perché è il driver principale: misura quanto il contenuto è strutturato per essere citato direttamente dai modelli AI nei loro risultati."
                                : "Highest weight because it is the primary driver: measures how well content is structured to be quoted directly by AI models in their results."}
                        />
                        <WeightRow
                            label={it ? "Brand Authority Signals" : "Brand Authority Signals"}
                            weight="20%"
                            color="#a78bfa"
                            description={it
                                ? "I modelli AI imparano a riconoscere i brand attraverso fonti autorevoli come Wikipedia, LinkedIn, Reddit. Un'ampia presenza su queste piattaforme aumenta la probabilità di essere citati."
                                : "AI models learn to recognize brands through authoritative sources like Wikipedia, LinkedIn, Reddit. A broad presence on these platforms increases the likelihood of being cited."}
                        />
                        <WeightRow
                            label={it ? "Content Quality & E-E-A-T" : "Content Quality & E-E-A-T"}
                            weight="20%"
                            color="#34d399"
                            description={it
                                ? "Esperienza, Expertise, Autorevolezza, Affidabilità: i modelli AI privilegiano contenuti con segnali di fiducia chiari (autore, data, fonti, pagine About/Contact)."
                                : "Experience, Expertise, Authoritativeness, Trustworthiness: AI models favor content with clear trust signals (author attribution, dates, sources, About/Contact pages)."}
                        />
                        <WeightRow
                            label={it ? "Technical Foundations" : "Technical Foundations"}
                            weight="15%"
                            color="#fbbf24"
                            description={it
                                ? "Prerequisiti tecnici che permettono il crawling: HTTPS, viewport, canonical, attributo lang, indicizzabilità, sitemap dichiarata, struttura heading corretta."
                                : "Technical prerequisites enabling crawling: HTTPS, viewport, canonical, lang attribute, indexability, declared sitemap, correct heading structure."}
                        />
                        <WeightRow
                            label={it ? "Structured Data" : "Structured Data"}
                            weight="10%"
                            color="#fb923c"
                            description={it
                                ? "JSON-LD e microdata forniscono contesto semantico direttamente ai modelli AI. Meno peso perché è un fattore moltiplicativo, non autonomo."
                                : "JSON-LD and microdata provide semantic context directly to AI models. Lower weight because it's a multiplying factor, not standalone."}
                        />
                        <WeightRow
                            label={it ? "Platform Optimization" : "Platform Optimization"}
                            weight="10%"
                            color="#f472b6"
                            description={it
                                ? "Score combinato su quattro piattaforme AI specifiche. È derivato dagli altri KPI, quindi ha peso inferiore per evitare doppio conteggio."
                                : "Combined score across four specific AI platforms. It is derived from other KPIs, so lower weight to avoid double-counting."}
                        />
                    </Section>

                    {/* ── 2. AI Citability ── */}
                    <Section title={it ? "2. AI Citability & Visibility" : "2. AI Citability & Visibility"}>
                        <p className="text-sm text-slate-400 mb-3">
                            {it
                                ? "Combina tre sotto-componenti per stimare la probabilità di citazione da parte dei motori AI:"
                                : "Combines three sub-components to estimate the probability of citation by AI search engines:"}
                        </p>
                        <FormulaBox>
                            AI_Citability_Score =<br />
                            &nbsp;&nbsp;citability_score × 0.60<br />
                            &nbsp;+ crawler_access_score × 0.20<br />
                            &nbsp;+ llms_txt_score × 0.20
                        </FormulaBox>

                        <div className="mt-4 space-y-3 text-sm">
                            <div>
                                <p className="font-medium text-slate-200 mb-1">
                                    {it ? "Citability Score (0–100)" : "Citability Score (0–100)"}
                                </p>
                                <p className="text-xs text-slate-400 mb-2">
                                    {it
                                        ? "Analizza il contenuto della pagina su 6 segnali, ognuno pesato:"
                                        : "Analyzes page content across 6 signals, each weighted:"}
                                </p>
                                <FormulaBox>
                                    citability = answer_passages×25 + factual_density×20<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    + authority_signals×20 + content_length×15<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    + structured_content×10 + unique_data×10
                                </FormulaBox>
                                <ul className="text-xs text-slate-400 space-y-1 ml-2">
                                    <li>• <strong className="text-slate-300">{it ? "Intestazioni-domanda" : "Question headers"}</strong>: {it ? "H2/H3 con parole interrogative (come, cosa, why, what…). Max 10 pt." : "H2/H3 with question words (how, what, why, when…). Max 10 pts."}</li>
                                    <li>• <strong className="text-slate-300">{it ? "Densità fattuale" : "Factual density"}</strong>: {it ? "Numeri, percentuali, valute, anni nel testo. Max 10 pt." : "Numbers, percentages, currencies, years in text. Max 10 pts."}</li>
                                    <li>• <strong className="text-slate-300">{it ? "Segnali di autorità" : "Authority signals"}</strong>: {it ? 'Frasi come "secondo", "founded", "certificato". Max 10 pt.' : 'Phrases like "according to", "founded", "certified". Max 10 pts.'}</li>
                                    <li>• <strong className="text-slate-300">{it ? "Lunghezza contenuto" : "Content length"}</strong>: {it ? "10 pt se >2000 parole, 7 se >1000, 5 se >500, 2 se meno." : "10 pts if >2000 words, 7 if >1000, 5 if >500, 2 otherwise."}</li>
                                    <li>• <strong className="text-slate-300">{it ? "Contenuto strutturato" : "Structured content"}</strong>: {it ? "Liste UL/OL e tabelle. Max 10 pt." : "UL/OL lists and tables. Max 10 pts."}</li>
                                    <li>• <strong className="text-slate-300">{it ? "Dati unici" : "Unique data"}</strong>: {it ? "Valori decimali e grandi numeri (milioni/miliardi). Max 10 pt." : "Decimal values and large numbers (millions/billions). Max 10 pts."}</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-medium text-slate-200 mb-1">
                                    {it ? "Crawler Access Score (0–100)" : "Crawler Access Score (0–100)"}
                                </p>
                                <FormulaBox>
                                    crawler_score = min(100, n_crawlers_explicitly_configured × 15)
                                </FormulaBox>
                                <p className="text-xs text-slate-400">
                                    {it
                                        ? "Conta quanti dei 9 AI crawler monitorati (GPTBot, Claude-Web, PerplexityBot…) hanno regole esplicite in robots.txt. Ogni crawler configurato vale 15 punti."
                                        : "Counts how many of the 9 monitored AI crawlers (GPTBot, Claude-Web, PerplexityBot…) have explicit rules in robots.txt. Each configured crawler is worth 15 points."}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium text-slate-200 mb-1">llms.txt Score</p>
                                <FormulaBox>
                                    llms_txt_score = 100 if status == "found" else 0
                                </FormulaBox>
                                <p className="text-xs text-slate-400">
                                    {it
                                        ? "Binario: il file /llms.txt esiste (100) oppure no (0). È l'equivalente AI di robots.txt — permette ai modelli di capire il sito senza crawling."
                                        : "Binary: the /llms.txt file exists (100) or not (0). It is the AI equivalent of robots.txt — lets models understand the site without crawling."}
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* ── 3. Technical Foundations ── */}
                    <Section title={it ? "3. Technical Foundations" : "3. Technical Foundations"}>
                        <FormulaBox>
                            technical_score = HTTPS(15) + viewport(15) + canonical(15)<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            + lang(10) + indexable(20) + sitemap(10) + H1(15/8)
                        </FormulaBox>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {[
                                { check: "HTTPS", pts: "15", note: it ? "Richiesto da tutti i crawler AI" : "Required by all AI crawlers" },
                                { check: "viewport", pts: "15", note: it ? "Mobile-first indexing" : "Mobile-first indexing" },
                                { check: "canonical", pts: "15", note: it ? "Previene contenuto duplicato" : "Prevents duplicate content" },
                                { check: "lang attr", pts: "10", note: it ? "Contesto linguistico per l'AI" : "Language context for AI" },
                                { check: "indexable", pts: "20", note: it ? "Nessun noindex nei meta robots" : "No noindex in meta robots" },
                                { check: "sitemap", pts: "10", note: it ? "Dichiarata in robots.txt" : "Declared in robots.txt" },
                                { check: "H1 = 1", pts: "15", note: it ? "Struttura chiara del documento" : "Clear document structure" },
                                { check: "H1 > 1", pts: "8", note: it ? "Penalità parziale" : "Partial penalty" },
                            ].map(({ check, pts, note }) => (
                                <div key={check} className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-2.5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-mono text-cyan-300">{check}</span>
                                        <span className="text-amber-300 font-semibold">+{pts} pt</span>
                                    </div>
                                    <p className="text-slate-400">{note}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* ── 4. Structured Data ── */}
                    <Section title={it ? "4. Structured Data (Schema.org)" : "4. Structured Data (Schema.org)"}>
                        <FormulaBox>
                            schema_score = min(100, n_schema_types × 15 + (25 if json_ld_found else 0))
                        </FormulaBox>
                        <p className="text-xs text-slate-400 mt-2">
                            {it
                                ? "Ogni tipo di schema distinto rilevato (Organization, WebSite, FAQPage, BreadcrumbList…) vale 15 punti. Il bonus +25 si attiva se è presente almeno uno script JSON-LD. Il punteggio non supera 100."
                                : "Each distinct schema type detected (Organization, WebSite, FAQPage, BreadcrumbList…) is worth 15 points. The +25 bonus activates if at least one JSON-LD script is present. Score is capped at 100."}
                        </p>
                    </Section>

                    {/* ── 5. Brand Authority ── */}
                    <Section title={it ? "5. Brand Authority Signals" : "5. Brand Authority Signals"}>
                        <FormulaBox>
                            brand_score = min(100, n_platforms_present × 16 + (20 if wikipedia else 0))
                        </FormulaBox>
                        <p className="text-xs text-slate-400 mt-2 mb-3">
                            {it
                                ? "Rileva i link uscenti verso le principali piattaforme di autorità. Wikipedia riceve un bonus separato (+20) perché è la fonte di training AI più citata."
                                : "Detects outbound links to major authority platforms. Wikipedia gets a separate bonus (+20) because it is the most cited AI training source."}
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            {["Wikipedia (+20)", "LinkedIn (+16)", "YouTube (+16)", "Reddit (+16)", "X/Twitter (+16)", "Facebook (+16)"].map((p) => (
                                <div key={p} className="rounded-lg border border-slate-700/40 bg-slate-800/30 px-3 py-2 text-center text-slate-300">
                                    {p}
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* ── 6. Content Quality ── */}
                    <Section title={it ? "6. Content Quality & E-E-A-T" : "6. Content Quality & E-E-A-T"}>
                        <FormulaBox>
                            content_score = word_count_score + readability_score + eeat_signals×8 + structure_bonus
                        </FormulaBox>
                        <div className="mt-3 space-y-2 text-xs text-slate-400">
                            <p><strong className="text-slate-300">{it ? "Word count" : "Word count"}</strong>: ≥1200→30, ≥700→22, ≥350→12, &lt;350→5 pt</p>
                            <p><strong className="text-slate-300">{it ? "Leggibilità" : "Readability"}</strong>: {it ? "Lunghezza media frase ≤22→20, ≤28→12, &gt;28→5 pt" : "Avg sentence length ≤22→20, ≤28→12, >28→5 pts"}</p>
                            <p><strong className="text-slate-300">E-E-A-T signals</strong>: {it ? "5 segnali ×8 pt ciascuno (max 40 pt):" : "5 signals ×8 pts each (max 40 pts):"}</p>
                            <ul className="ml-3 space-y-1">
                                <li>• {it ? "Link a pagina About" : "About page link"} (+8)</li>
                                <li>• {it ? "Link a pagina Contact" : "Contact page link"} (+8)</li>
                                <li>• {it ? "Segnale autore (by/autore/author nel testo)" : "Author signal (by/author in text)"} (+8)</li>
                                <li>• {it ? "Data recente (anno 20xx nel testo)" : "Freshness signal (year 20xx in text)"} (+8)</li>
                                <li>• {it ? 'Citazione fonti (according to/secondo/fonte)' : 'Source citation (according to/source/fonte)'} (+8)</li>
                            </ul>
                            <p><strong className="text-slate-300">{it ? "Struttura" : "Structure"}</strong>: {it ? "Liste o tabelle presenti" : "Lists or tables present"} (+10)</p>
                        </div>
                    </Section>

                    {/* ── 7. Platform Scores ── */}
                    <Section title={it ? "7. Score per Piattaforma AI" : "7. Per-Platform AI Scores"}>
                        <p className="text-sm text-slate-400 mb-3">
                            {it
                                ? "Ogni piattaforma pesa i KPI diversamente in base al proprio algoritmo di recupero delle informazioni:"
                                : "Each platform weights KPIs differently based on its own information retrieval algorithm:"}
                        </p>
                        <FormulaBox>
                            ChatGPT_Search = citability×0.50 + crawlers×6 + llms_txt?+15{"\n"}
                            Perplexity&nbsp;&nbsp;&nbsp;&nbsp; = citability×0.45 + schema×0.25 + meta×0.20 + crawlers×4{"\n"}
                            Google_AIO&nbsp;&nbsp;&nbsp;&nbsp; = schema×0.45 + meta×0.25 + crawlers×4 + llms_txt?+10{"\n"}
                            Bing_Copilot&nbsp;&nbsp; = meta×0.35 + schema×0.25 + crawlers×5 + citability×0.20
                        </FormulaBox>
                        <p className="text-xs text-slate-400 mt-2">
                            {it
                                ? "ChatGPT Search privilegia la citabilità del contenuto; Google AI Overviews privilegia lo schema markup; Bing Copilot privilegia i meta tag. Il Platform Score complessivo è la media aritmetica dei quattro."
                                : "ChatGPT Search prioritizes content citability; Google AI Overviews prioritizes schema markup; Bing Copilot prioritizes meta tags. The overall Platform Score is the arithmetic mean of the four."}
                        </p>
                    </Section>

                    {/* ── 8. Soglie colore ── */}
                    <Section title={it ? "8. Soglie di Valutazione" : "8. Score Thresholds"}>
                        <ScoreRange
                            color="#2dd4bf"
                            range="70–100"
                            label={it ? "Buono" : "Good"}
                            meaning={it
                                ? "Il sito è ben posizionato per la visibilità AI. Focus su ottimizzazioni incrementali."
                                : "The site is well-positioned for AI visibility. Focus on incremental optimizations."}
                        />
                        <ScoreRange
                            color="#fbbf24"
                            range="45–69"
                            label={it ? "Moderato" : "Moderate"}
                            meaning={it
                                ? "Visibilità parziale. Alcune lacune critiche da colmare nelle aree a peso maggiore."
                                : "Partial visibility. Some critical gaps to fill in higher-weight areas."}
                        />
                        <ScoreRange
                            color="#fb7185"
                            range="0–44"
                            label={it ? "Critico" : "Critical"}
                            meaning={it
                                ? "Alta probabilità di essere ignorato dai motori AI. Intervenire immediatamente su citability, llms.txt e schema."
                                : "High probability of being ignored by AI search engines. Act immediately on citability, llms.txt, and schema."}
                        />
                    </Section>

                    {/* ── Note ── */}
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-200/80 leading-relaxed">
                        {it
                            ? "Nota: il GEO Score è un indicatore orientativo basato sull'analisi statica del contenuto pubblicamente accessibile. Non riflette dati di traffico reali né accordi commerciali con le piattaforme AI. I punteggi delle piattaforme sono stime algoritmiche, non valori ufficiali."
                            : "Note: the GEO Score is a directional indicator based on static analysis of publicly accessible content. It does not reflect actual traffic data or commercial agreements with AI platforms. Platform scores are algorithmic estimates, not official values."}
                    </div>
                </div>
            </div>
        </div>
    );
}
