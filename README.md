# OpenGraph CLI

A CLI tool to fetch and display OpenGraph metadata from web URLs and local servers.

## Installation

```bash
bun install
```

## Usage

### Run directly with Bun

```bash
bun run src/index.ts <url>
```

### Examples

Fetch OpenGraph metadata from a website:
```bash
bun run src/index.ts https://github.com
```

Fetch from a local development server:
```bash
bun run src/index.ts http://localhost:3000
```

### Build

Build the CLI for distribution:
```bash
bun run build
```

After building, you can run the compiled version:
```bash
./dist/index.js https://example.com
```

## Features

- Fetch OpenGraph metadata from any URL
- Supports both remote URLs and local servers
- Color-coded output for easy reading
- Fast execution with Bun runtime
- TypeScript support

## OpenGraph Properties Displayed

- Title
- Description
- Image
- URL
- Type
- Site Name
- Locale
- All other custom OG properties

## Requirements

- [Bun](https://bun.sh) runtime

## License

MIT
