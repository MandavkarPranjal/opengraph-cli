import type { OpenGraphData, PerformanceMetrics } from "./types";

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
};

export function formatOpenGraphData(data: OpenGraphData, url: string): string {
    const lines: string[] = [];

    lines.push(`\n${colors.bright}${colors.cyan}OpenGraph Preview${colors.reset}`);
    lines.push(`${colors.dim}${"=".repeat(50)}${colors.reset}\n`);

    lines.push(`${colors.bright}Page URL:${colors.reset} ${colors.blue}${url}${colors.reset}\n`);

    const formatField = (label: string, value: string | undefined) => {
        if (value) {
            lines.push(`${colors.green}${label}:${colors.reset} ${value}`);
        }
    };

    formatField("Title", data.title);
    formatField("Description", data.description);
    formatField("Image", data.image);
    formatField("og:url", data.url);
    formatField("Type", data.type);
    formatField("Site Name", data.siteName);
    formatField("Locale", data.locale);

    const standardKeys = ["title", "description", "image", "url", "type", "siteName", "locale"];
    const otherKeys = Object.keys(data)
        .filter((key) => !standardKeys.includes(key))
        .sort();

    if (otherKeys.length > 0) {
        lines.push(`\n${colors.yellow}Other Properties:${colors.reset}`);
        otherKeys.forEach((key) => {
            formatField(key, data[key]);
        });
    }

    lines.push(`\n${colors.dim}${"=".repeat(50)}${colors.reset}\n`);

    return lines.join("\n");
}

export function formatError(error: string): string {
    return `\n${colors.bright}${colors.magenta}Error:${colors.reset} ${error}\n`;
}

export function formatPerformanceMetrics(metrics: PerformanceMetrics): string {
    const lines: string[] = [];

    lines.push(`\n${colors.bright}${colors.yellow}Performance Metrics${colors.reset}`);
    lines.push(`${colors.dim}${"=".repeat(50)}${colors.reset}\n`);

    lines.push(`${colors.green}Fetch Time:${colors.reset} ${metrics.fetchMs.toFixed(2)}ms (${(metrics.fetchMs / 1000).toFixed(3)}s)`);
    lines.push(`${colors.green}Parse Time:${colors.reset} ${metrics.parseMs.toFixed(2)}ms (${(metrics.parseMs / 1000).toFixed(3)}s)`);

    if (metrics.renderMs !== undefined) {
        lines.push(`${colors.green}Render Time:${colors.reset} ${metrics.renderMs.toFixed(2)}ms (${(metrics.renderMs / 1000).toFixed(3)}s)`);
    }

    if (metrics.clipboardMs !== undefined) {
        lines.push(`${colors.green}Clipboard Time:${colors.reset} ${metrics.clipboardMs.toFixed(2)}ms (${(metrics.clipboardMs / 1000).toFixed(3)}s)`);
    }

    lines.push(`${colors.green}Total Time:${colors.reset} ${metrics.totalMs.toFixed(2)}ms (${(metrics.totalMs / 1000).toFixed(3)}s)`);

    lines.push(`\n${colors.dim}${"=".repeat(50)}${colors.reset}\n`);

    return lines.join("\n");
}
