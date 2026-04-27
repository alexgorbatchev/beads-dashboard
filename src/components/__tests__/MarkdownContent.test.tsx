import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { MarkdownContent } from "../MarkdownContent";

describe("MarkdownContent", () => {
  it("renders markdown formatting and GFM links", () => {
    const html = renderToStaticMarkup(<MarkdownContent content={"# Title\n\n**Bold** and https://example.com"} />);

    expect(html).toBe(
      '<div data-testid="MarkdownContent" class="markdown-content text-sm text-secondary leading-relaxed"><h1>Title</h1>\n<p><strong>Bold</strong> and <a href="https://example.com" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline break-all">https://example.com</a></p></div>',
    );
  });

  it("preserves authored line breaks", () => {
    const html = renderToStaticMarkup(<MarkdownContent content={"first line\nsecond line"} />);

    expect(html).toBe(
      '<div data-testid="MarkdownContent" class="markdown-content text-sm text-secondary leading-relaxed"><p>first line<br/>\nsecond line</p></div>',
    );
  });
});
