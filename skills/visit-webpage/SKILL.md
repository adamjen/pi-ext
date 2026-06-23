---
name: visit-webpage
description: Visit a webpage and extract its content as markdown, or fetch images.
---

# Visit Webpage

Fetch and extract readable content from web pages as markdown, or download images. Handles JavaScript-rendered content via Jina Reader.

## Usage

`visit.py <url>`

## Examples

```bash
# Read an article (returns markdown)
visit.py https://example.com/article

# Download an image
visit.py https://example.com/image.png
# Then use read tool to view: read /tmp/visit-image-xxx.png
```

## Output

- **HTML pages**: Returns markdown content.
- **Images**: Downloads image to a temp file and prints the path. Supports PNG, JPEG, GIF, and WebP.

## Features

- Extracts main content from HTML and converts to clean markdown.
- Handles JS-rendered pages via Jina Reader.
- Auto-detects and downloads images to temp files.
- Retries on rate limiting (HTTP 451).
- 5MB max image size limit.

## When to Use

- Reading articles, blog posts, or documentation.
- Extracting content from search results.
- Downloading images from URLs.
- Following links from web search.
```
