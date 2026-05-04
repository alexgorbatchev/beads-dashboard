import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { MarkdownContent } from "../MarkdownContent";

const markdownContentClassNameHtml: string = [
  "text-sm leading-relaxed text-secondary",
  "[&amp;&gt;*+*]:mt-3",
  "[&amp;_h1]:text-base [&amp;_h2]:text-[0.9375rem] [&amp;_h3]:text-sm [&amp;_h4]:text-sm [&amp;_h5]:text-sm [&amp;_h6]:text-sm",
  "[&amp;_h1]:font-semibold [&amp;_h2]:font-semibold [&amp;_h3]:font-semibold [&amp;_h4]:font-semibold [&amp;_h5]:font-semibold [&amp;_h6]:font-semibold",
  "[&amp;_h1]:leading-[1.4] [&amp;_h2]:leading-[1.4] [&amp;_h3]:leading-[1.4] [&amp;_h4]:leading-[1.4] [&amp;_h5]:leading-[1.4] [&amp;_h6]:leading-[1.4]",
  "[&amp;_h1]:text-primary [&amp;_h2]:text-primary [&amp;_h3]:text-primary [&amp;_h4]:text-primary [&amp;_h5]:text-primary [&amp;_h6]:text-primary",
  "[&amp;_ul]:list-disc [&amp;_ol]:list-decimal [&amp;_ul]:pl-5 [&amp;_ol]:pl-5 [&amp;_li+li]:mt-1",
  "[&amp;_blockquote]:border-l-2 [&amp;_blockquote]:border-border [&amp;_blockquote]:pl-3 [&amp;_blockquote]:text-muted",
  "[&amp;_pre]:overflow-x-auto [&amp;_pre]:rounded-md [&amp;_pre]:bg-surface [&amp;_pre]:p-3",
  "[&amp;_code]:rounded-sm [&amp;_code]:bg-surface [&amp;_code]:px-[0.3rem] [&amp;_code]:py-[0.1rem] [&amp;_code]:font-mono [&amp;_code]:text-xs [&amp;_code]:text-primary",
  "[&amp;_pre_code]:block [&amp;_pre_code]:rounded-none [&amp;_pre_code]:bg-transparent [&amp;_pre_code]:p-0",
  "[&amp;_table]:block [&amp;_table]:w-full [&amp;_table]:overflow-x-auto",
  "[&amp;_th]:border [&amp;_td]:border [&amp;_th]:border-border [&amp;_td]:border-border [&amp;_th]:px-2.5 [&amp;_td]:px-2.5 [&amp;_th]:py-1.5 [&amp;_td]:py-1.5",
  "[&amp;_th]:text-left [&amp;_td]:text-left [&amp;_th]:align-top [&amp;_td]:align-top [&amp;_th]:font-semibold [&amp;_th]:text-primary",
  "[&amp;_hr]:border-0 [&amp;_hr]:border-t [&amp;_hr]:border-border",
  "[&amp;_input[type=&#x27;checkbox&#x27;]]:mr-2 [&amp;_input[type=&#x27;checkbox&#x27;]]:pointer-events-none",
].join(" ");

describe("MarkdownContent", () => {
  it("renders markdown formatting and GFM links", () => {
    const html = renderToStaticMarkup(<MarkdownContent content={"# Title\n\n**Bold** and https://example.com"} />);

    expect(html).toBe(
      `<div data-testid="MarkdownContent" class="${markdownContentClassNameHtml}"><h1>Title</h1>\n<p><strong>Bold</strong> and <a href="https://example.com" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline break-all">https://example.com</a></p></div>`,
    );
  });

  it("preserves authored line breaks", () => {
    const html = renderToStaticMarkup(<MarkdownContent content={"first line\nsecond line"} />);

    expect(html).toBe(
      `<div data-testid="MarkdownContent" class="${markdownContentClassNameHtml}"><p>first line<br/>\nsecond line</p></div>`,
    );
  });
});
