export interface OpenGraphData {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
    locale?: string;
    [key: string]: string | undefined;
}

export interface PerformanceMetrics {
    fetchMs: number;
    parseMs: number;
    clipboardMs?: number;
    renderMs?: number;
    totalMs: number;
}
