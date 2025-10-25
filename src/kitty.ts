import { execSync } from "child_process";

export function isKittySupported(): boolean {
  return process.env.TERM === "xterm-kitty" || !!process.env.KITTY_WINDOW_ID;
}

export async function renderKittyImage(imageUrl: string): Promise<void> {
  try {
    // Use kitty's icat kitten to display the image directly from URL
    execSync(`kitty +kitten icat --align left --scale-up "${imageUrl}"`, {
      stdio: "inherit"
    });

    console.log(); // Add newline after image
  } catch (error) {
    // Check if it's a terminal issue (common in non-interactive environments)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("controlling terminal") || errorMessage.includes("/dev/tty") || errorMessage.includes("no such device") || errorMessage.includes("Command failed")) {
      throw new Error("Kitty image display requires an interactive terminal");
    }
    throw new Error(`Failed to render image with kitty: ${errorMessage}`);
  }
}
