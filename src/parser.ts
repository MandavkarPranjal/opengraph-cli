import * as cheerio from "cheerio";
import type { OpenGraphData } from "./types";

export async function fetchHTML(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        clearTimeout(timeout);
    }
}

export function parseOpenGraph(html: string): OpenGraphData {
    const $ = cheerio.load(html);
    const ogData: OpenGraphData = {};

    $('meta[property^="og:"]').each((_, element) => {
        const property = $(element).attr("property");
        const content = $(element).attr("content");

        if (property && content) {
            const raw = property.slice(3); // drop "og:"
            const normalized = raw.replace(/:/g, "_");
            const camel = normalized.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            ogData[camel] = content;
        }
    });

    if (!ogData.title) {
        ogData.title = $("title").text() || undefined;
    }

    if (!ogData.description) {
        ogData.description =
            $('meta[name="description"]').attr("content") || undefined;
    }

    return ogData;
}

export async function getOpenGraphData(url: string): Promise<{ data: OpenGraphData; fetchMs: number; parseMs: number }> {
    const fetchStart = performance.now();
    const html = await fetchHTML(url);
    const fetchMs = performance.now() - fetchStart;

    const parseStart = performance.now();
    const data = parseOpenGraph(html);
    const parseMs = performance.now() - parseStart;

    return { data, fetchMs, parseMs };
}
