import type { OpenGraphData } from "./types";

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

  lines.push(`${colors.bright}URL:${colors.reset} ${colors.blue}${url}${colors.reset}\n`);

  const formatField = (label: string, value: string | undefined) => {
    if (value) {
      lines.push(`${colors.green}${label}:${colors.reset} ${value}`);
    }
  };

  formatField("Title", data.title);
  formatField("Description", data.description);
  formatField("Image", data.image);
  formatField("URL", data.url);
  formatField("Type", data.type);
  formatField("Site Name", data.siteName);
  formatField("Locale", data.locale);

  const standardKeys = ["title", "description", "image", "url", "type", "siteName", "locale"];
  const otherKeys = Object.keys(data).filter((key) => !standardKeys.includes(key));

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
