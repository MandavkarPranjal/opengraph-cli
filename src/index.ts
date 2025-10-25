#!/usr/bin/env bun

import { getOpenGraphData } from "./parser";
import { formatOpenGraphData, formatError, formatPerformanceMetrics } from "./formatter";
import type { PerformanceMetrics } from "./types";
import clipboard from "clipboardy";
import { renderKittyImage, isKittySupported } from "./kitty";

// Import colors for help formatting
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

function showHelp() {
    console.log(`
${colors.bright}${colors.cyan}OpenGraph Preview CLI${colors.reset}

${colors.bright}USAGE:${colors.reset}
  ${colors.green}opengraph-cli${colors.reset} <url>                    ${colors.dim}Fetch and display OpenGraph metadata from a URL${colors.reset}
  ${colors.green}opengraph-cli${colors.reset} <url> ${colors.yellow}-i${colors.reset}, ${colors.yellow}--image${colors.reset}      ${colors.dim}Display og:image using kitty protocol (if supported)${colors.reset}
  ${colors.green}opengraph-cli${colors.reset} <url> ${colors.yellow}-io${colors.reset}, ${colors.yellow}--image-only${colors.reset} ${colors.dim}Display only the og:image using kitty protocol (if supported)${colors.reset}
  ${colors.green}opengraph-cli${colors.reset} <url> ${colors.yellow}-n${colors.reset}, ${colors.yellow}--nerd${colors.reset}       ${colors.dim}Show performance metrics${colors.reset}
  ${colors.green}opengraph-cli${colors.reset} ${colors.yellow}-n${colors.reset}, ${colors.yellow}--nerd${colors.reset} <url>       ${colors.dim}Show performance metrics${colors.reset}
  ${colors.green}opengraph-cli${colors.reset} ${colors.yellow}--help${colors.reset}, ${colors.yellow}-h${colors.reset}         ${colors.dim}Show this help message${colors.reset}

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.blue}opengraph-cli${colors.reset} https://example.com
  ${colors.blue}opengraph-cli${colors.reset} http://localhost:3000
  ${colors.blue}opengraph-cli${colors.reset} https://example.com ${colors.yellow}-i${colors.reset}
  ${colors.blue}opengraph-cli${colors.reset} https://example.com ${colors.yellow}-io${colors.reset}
  ${colors.blue}opengraph-cli${colors.reset} https://example.com ${colors.yellow}-n${colors.reset}
  ${colors.blue}opengraph-cli${colors.reset} ${colors.yellow}-n${colors.reset} https://example.com

${colors.bright}DESCRIPTION:${colors.reset}
  Fetches and displays OpenGraph metadata from web URLs and local development servers.
  Supports both remote URLs and local development servers.

  ${colors.bright}Image Handling:${colors.reset}
  • If an og:image is found, its URL will be copied to the clipboard
  • Use ${colors.yellow}-i${colors.reset}/${colors.yellow}--image${colors.reset} flag to render the image inline using kitty image protocol
  • Use ${colors.yellow}-io${colors.reset}/${colors.yellow}--image-only${colors.reset} to display only the image without metadata
  • Falls back to copying the URL if kitty is not available

  ${colors.bright}Performance:${colors.reset}
  • Use ${colors.yellow}-n${colors.reset}/${colors.yellow}--nerd${colors.reset} flag to display performance metrics
`);
    process.exit(0);
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        showHelp();
    }

    const showNerd = args.includes("--nerd") || args.includes("-n");
    const showImage = args.includes("--image") || args.includes("-i");
    const imageOnly = args.includes("--image-only") || args.includes("-io");
    const url = args.find(arg => !arg.startsWith("--") && !arg.startsWith("-"));

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

        let clipboardMs: number | undefined;
        let renderMs: number | undefined;

        if (imageOnly) {
            // Display only the image
            if (ogData.image) {
                const imageUrl = (() => {
                    try { return new URL(ogData.image, url).toString(); } catch { return undefined; }
                })();
                if (!imageUrl) {
                    console.error(formatError("og:image is not a valid URL and could not be resolved against the page URL"));
                    // continue without image actions
                }

                const kittySupported = isKittySupported();

                if (kittySupported && imageUrl) {
                    try {
                        const renderStart = performance.now();
                        await renderKittyImage(imageUrl);
                        renderMs = performance.now() - renderStart;

                        const clipboardStart = performance.now();
                        await clipboard.write(imageUrl);
                        clipboardMs = performance.now() - clipboardStart;
                        console.log(`\n✓ Image displayed and URL copied to clipboard\n`);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        if (errorMessage.includes("Command failed") || errorMessage.includes("interactive terminal") || errorMessage.includes("controlling terminal") || errorMessage.includes("no such device")) {
                            // Graceful fallback for non-interactive environments
                            try {
                                const clipboardStart = performance.now();
                                await clipboard.write(imageUrl!);
                                clipboardMs = performance.now() - clipboardStart;
                                console.log(`\n✓ Image URL copied to clipboard (kitty not available in this environment)\n`);
                            } catch (clipError) {
                                console.error(formatError(`Failed to copy image URL to clipboard: ${clipError instanceof Error ? clipError.message : String(clipError)}`));
                            }
                        } else {
                            console.error(formatError(`Failed to render image: ${errorMessage}`));
                            try {
                                const clipboardStart = performance.now();
                                await clipboard.write(ogData.image);
                                clipboardMs = performance.now() - clipboardStart;
                                console.log(`\n✓ Image URL copied to clipboard\n`);
                            } catch (clipError) {
                                console.error(formatError(`Failed to copy image URL to clipboard: ${clipError instanceof Error ? clipError.message : String(clipError)}`));
                            }
                        }
                    }
                } else {
                    try {
                        const clipboardStart = performance.now();
                        await clipboard.write(ogData.image);
                        clipboardMs = performance.now() - clipboardStart;
                        console.log(`\n✓ Image URL copied to clipboard (kitty not supported in this terminal)\n`);
                    } catch (error) {
                        console.error(formatError(`Failed to copy image URL to clipboard: ${error instanceof Error ? error.message : String(error)}`));
                    }
                }
            } else {
                console.log(formatError("No og:image found on this page."));
            }
        } else {
            // Display full metadata
            console.log(formatOpenGraphData(ogData, url));

            if (ogData.image) {
                if (showImage) {
                    const kittySupported = isKittySupported();

                    if (kittySupported) {
                        try {
                            const renderStart = performance.now();
                            await renderKittyImage(imageUrl!);
                            renderMs = performance.now() - renderStart;

                            const clipboardStart = performance.now();
                            await clipboard.write(ogData.image);
                            clipboardMs = performance.now() - clipboardStart;
                            console.log(`\n✓ Image rendered and URL copied to clipboard\n`);
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            if (errorMessage.includes("Command failed") || errorMessage.includes("interactive terminal") || errorMessage.includes("controlling terminal") || errorMessage.includes("no such device")) {
                                // Graceful fallback for non-interactive environments
                                try {
                                    const clipboardStart = performance.now();
                                    await clipboard.write(ogData.image);
                                    clipboardMs = performance.now() - clipboardStart;
                                    console.log(`\n✓ Image URL copied to clipboard (kitty not available in this environment)\n`);
                                } catch (clipError) {
                                    console.error(formatError(`Failed to copy image URL to clipboard: ${clipError instanceof Error ? clipError.message : String(clipError)}`));
                                }
                            } else {
                                console.error(formatError(`Failed to render image: ${errorMessage}`));
                                try {
                                    const clipboardStart = performance.now();
                                    await clipboard.write(ogData.image);
                                    clipboardMs = performance.now() - clipboardStart;
                                    console.log(`\n✓ Image URL copied to clipboard\n`);
                                } catch (clipError) {
                                    console.error(formatError(`Failed to copy image URL to clipboard: ${clipError instanceof Error ? clipError.message : String(clipError)}`));
                                }
                            }
                        }
                    } else {
                        try {
                            const clipboardStart = performance.now();
                            await clipboard.write(ogData.image);
                            clipboardMs = performance.now() - clipboardStart;
                            console.log(`\n✓ Image URL copied to clipboard (kitty not supported in this terminal)\n`);
                        } catch (error) {
                            console.error(formatError(`Failed to copy image URL to clipboard: ${error instanceof Error ? error.message : String(error)}`));
                        }
                    }
                } else {
                    // Just copy URL without attempting to render
                    try {
                        const clipboardStart = performance.now();
                        await clipboard.write(ogData.image);
                        clipboardMs = performance.now() - clipboardStart;
                        console.log(`\n✓ Image URL copied to clipboard\n`);
                    } catch (error) {
                        console.error(formatError(`Failed to copy image URL to clipboard: ${error instanceof Error ? error.message : String(error)}`));
                    }
                }
            }
        }

        const totalMs = performance.now() - totalStart;

        if (showNerd) {
            const metrics: PerformanceMetrics = {
                fetchMs,
                parseMs,
                clipboardMs,
                ...(renderMs !== undefined ? { renderMs } : {}),
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
