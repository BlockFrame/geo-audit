import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";

const sampleReport = {
    url: "https://example.com",
    business_type: "Other",
    business_type_confidence: 0,
    geo_score: 13,
    score_breakdown: {
        "AI Citability & Visibility": { score: 1, weight: "25%" },
        "Brand Authority Signals": { score: 0, weight: "20%" },
        "Content Quality & E-E-A-T": { score: 25, weight: "20%" },
        "Technical Foundations": { score: 50, weight: "15%" },
        "Structured Data": { score: 0, weight: "10%" },
        "Platform Optimization": { score: 8, weight: "10%" },
    },
    crawler_matrix: [
        {
            name: "GPTBot",
            company: "OpenAI",
            type: "search",
            tier: 1,
            access: "unknown",
            explicitly_configured: false,
            rules: [],
        },
    ],
    llms_txt_status: "not_found",
    llms_txt_url: "https://example.com/llms.txt",
    schema_found: false,
    schema_types: [],
    schema_recommendations: ["Add JSON-LD structured data"],
    meta_issues: [{ severity: "high", issue: "Missing meta description" }],
    technical_audit: {
        score: 50,
        checks: { https: true, viewport: true, canonical: false },
        issues: ["Missing canonical tag"],
    },
    content_quality: {
        score: 25,
        word_count: 120,
        avg_sentence_length: 16,
        eeat_signals: { about_page_link: false, contact_page_link: false },
        issues: ["Increase depth"],
    },
    brand_mentions: {
        score: 0,
        platform_presence: { wikipedia: false, linkedin: false },
        issues: ["No Wikipedia entity signal found"],
    },
    platform_readiness: {
        overall_score: 8,
        platform_scores: {
            chatgpt_search: 1,
            perplexity: 9,
            google_ai_overviews: 10,
            google_gemini: 8,
            bing_copilot: 15,
        },
    },
    citability_score: 3,
    citability_verdict: "low",
    citability_details: {
        answer_passages: 0,
        factual_density: 1,
        authority_signals: 0,
        content_length: 2,
        structured_content: 0,
        unique_data: 0,
    },
    llms_txt_recommended: "# example.com - AI Model Information\n\n## About\nExample content.",
    recommendations: [
        {
            priority: "critical",
            action: "Create and deploy llms.txt at domain root",
            impact: "+15 GEO points",
            effort: "1-2 hours",
        },
    ],
    audit_date: "2026-06-21",
};

async function mockBackendRoutes(page: Page) {
    await page.route("**/api/audit", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(sampleReport),
        });
    });

    await page.route("**/api/copilotkit**", async (route) => {
        const request = route.request();
        let body: { method?: string } | null = null;
        try {
            body = request.postDataJSON?.() as { method?: string } | null;
        } catch {
            body = null;
        }

        if (request.url().endsWith("/info") || body?.method === "info") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    version: "test",
                    agents: { default: { description: "Test agent", capabilities: {} } },
                    audioFileTranscriptionEnabled: false,
                    a2uiEnabled: false,
                    openGenerativeUIEnabled: false,
                }),
            });
            return;
        }

        if (body?.method === "agent/connect") {
            await route.fulfill({ status: 204 });
            return;
        }

        await route.fulfill({ status: 204 });
    });
}

async function waitForClientHydration(page: Page) {
    await expect(page.getByLabel("Chat message")).toBeVisible();
    await page.waitForTimeout(500);
}

async function expectNoSeriousA11yViolations(page: Page) {
    const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

    const blockingViolations = results.violations.filter((violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );

    expect(blockingViolations).toEqual([]);
}

test.beforeEach(async ({ page }) => {
    await mockBackendRoutes(page);
});

test("empty dashboard state meets the accessibility target", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForClientHydration(page);

    await expect(page.getByRole("main", { name: "GEO audit dashboard" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "GEO audit chat assistant" })).toBeVisible();
    await expect(page.getByLabel("Website URL")).toBeVisible();
    await expect(page.getByLabel("Chat message")).toBeVisible();
    await expect(page.getByRole("link", { name: "Skip to audit dashboard" })).toBeAttached();

    await expectNoSeriousA11yViolations(page);
});

test("completed audit dashboard meets the accessibility target", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForClientHydration(page);

    await expect(page.locator("#audit-url")).toBeVisible();
    await page.locator("#audit-url").fill("example.com");
    await expect(page.locator("#audit-url")).toHaveValue("example.com");
    await page.getByRole("button", { name: "Run audit" }).click({ force: true });

    await expect(page.getByText("FULL VERBOSE REPORT")).toBeVisible();
    await expect(page.getByText("13/100").first()).toBeVisible();

    await expectNoSeriousA11yViolations(page);
});

test("methodology dialog has accessible name, description, and keyboard close", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForClientHydration(page);

    await page.getByRole("button", { name: "How KPIs are calculated" }).click({ force: true });

    const dialog = page.getByRole("dialog", { name: "GEO Score Methodology" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Close" })).toBeFocused();

    await expectNoSeriousA11yViolations(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "How KPIs are calculated" })).toBeFocused();
});