#!/usr/bin/env bun

import { getOpenGraphData } from "./parser";
import { formatOpenGraphData, formatError, formatPerformanceMetrics } from "./formatter";
import type { PerformanceMetrics } from "./types";
import clipboard from "clipboardy";

function showHelp() {
    console.log(`
OpenGraph Preview CLI

Usage:
  opengraph-cli <url>              Fetch and display OpenGraph metadata from a URL
  opengraph-cli <url> --nerd       Show performance metrics
  opengraph-cli --nerd <url>       Show performance metrics
  opengraph-cli --help, -h         Show this help message

Examples:
  opengraph-cli https://example.com
  opengraph-cli http://localhost:3000
  opengraph-cli https://example.com --nerd
  opengraph-cli --nerd https://example.com

Description:
  Fetches and displays OpenGraph metadata from web URLs and local servers.
  Supports both remote URLs and local development servers.
  If an og:image is found, its URL will be copied to the clipboard.

  Use --nerd flag to display performance metrics.
`);
    process.exit(0);
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        showHelp();
    }

    const showNerd = args.includes("--nerd");
    const url = args.find(arg => !arg.startsWith("--"));

    if (!url) {
        console.error(formatError("No URL provided."));
        process.exit(1);
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        console.error(formatError("Invalid URL. Must start with http:// or https://"));
        process.exit(1);
    }

    try {
        const totalStart = performance.now();

        console.log(`\nFetching OpenGraph data from: ${url}...`);
        const { data: ogData, fetchMs, parseMs } = await getOpenGraphData(url);

        if (Object.keys(ogData).length === 0) {
            console.log(formatError("No OpenGraph metadata found on this page."));
            process.exit(0);
        }

        console.log(formatOpenGraphData(ogData, url));

        let clipboardMs: number | undefined;
        if (ogData.image) {
            try {
                const clipboardStart = performance.now();
                await clipboard.write(ogData.image);
                clipboardMs = performance.now() - clipboardStart;
                console.log(`\n✓ Image URL copied to clipboard\n`);
            } catch (error) {
                console.error(formatError(`Failed to copy image URL to clipboard: ${error instanceof Error ? error.message : String(error)}`));
            }
        }

        const totalMs = performance.now() - totalStart;

        if (showNerd) {
            const metrics: PerformanceMetrics = {
                fetchMs,
                parseMs,
                clipboardMs,
                totalMs
            };
            console.log(formatPerformanceMetrics(metrics));
        }
    } catch (error) {
        console.error(
            formatError(error instanceof Error ? error.message : String(error))
        );
        process.exit(1);
    }
}

main();
