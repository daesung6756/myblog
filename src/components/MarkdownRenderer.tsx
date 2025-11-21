import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

export default function MarkdownRenderer({ source }: { source: string }) {
  // 모든 줄바꿈을 <br />로 변환
  const processedSource = source.replace(/\n/g, '<br />\n');
  
  return (
    <div className="prose max-w-none dark:prose-invert">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
      >
        {processedSource}
      </ReactMarkdown>
    </div>
  );
}
