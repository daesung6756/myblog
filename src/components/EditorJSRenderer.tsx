"use client";
import { memo } from "react";

interface EditorJSRendererProps {
  data: any;
}

const EditorJSRenderer = ({ data }: EditorJSRendererProps) => {
  // 데이터 구조 검증 및 정규화
  let normalizedData = data;
  
  // data가 문자열인 경우 JSON 파싱 시도
  if (typeof data === 'string') {
    try {
      normalizedData = JSON.parse(data);
    } catch {
      normalizedData = { blocks: [] };
    }
  }
  
  // data가 객체가 아니거나 blocks가 없는 경우
  if (!normalizedData || typeof normalizedData !== 'object') {
    normalizedData = { blocks: [] };
  }
  
  // blocks가 배열이 아닌 경우
  if (!Array.isArray(normalizedData.blocks)) {
    normalizedData = { blocks: [] };
  }

  if (normalizedData.blocks.length === 0) {
    return (
      <div className="text-gray-400 italic">내용이 없습니다.</div>
    );
  }

  const renderBlock = (block: any, index: number) => {
    switch (block.type) {
      case "header":
        const level = block.data?.level || 2;
        const headerText = block.data?.text || '';
        const headerClass = "font-bold my-4";
        
        if (level === 1) return <h1 key={index} className={headerClass} dangerouslySetInnerHTML={{ __html: headerText }} />;
        if (level === 2) return <h2 key={index} className={headerClass} dangerouslySetInnerHTML={{ __html: headerText }} />;
        if (level === 3) return <h3 key={index} className={headerClass} dangerouslySetInnerHTML={{ __html: headerText }} />;
        if (level === 4) return <h4 key={index} className={headerClass} dangerouslySetInnerHTML={{ __html: headerText }} />;
        if (level === 5) return <h5 key={index} className={headerClass} dangerouslySetInnerHTML={{ __html: headerText }} />;
        return <h6 key={index} className={headerClass} dangerouslySetInnerHTML={{ __html: headerText }} />;

      case "paragraph":
        const paragraphText = block.data?.text || '';
        if (!paragraphText) return null;
        return (
          <p
            key={index}
            className="my-3"
            dangerouslySetInnerHTML={{ __html: paragraphText }}
          />
        );

      case "list":
        const ListTag = block.data.style === "ordered" ? "ol" : "ul";
        const items = Array.isArray(block.data.items) ? block.data.items : [];
        
        return (
          <ListTag
            key={index}
            className={`my-3 ${
              block.data.style === "ordered"
                ? "list-decimal"
                : "list-disc"
            } ml-6`}
          >
            {items.map((item: any, i: number) => {
              // item이 객체인 경우 content 필드 사용, 문자열인 경우 그대로 사용
              const content = typeof item === 'string' ? item : (item.content || item.text || '');
              return <li key={i} dangerouslySetInnerHTML={{ __html: content }} />;
            })}
          </ListTag>
        );

      case "checklist":
        return (
          <div key={index} className="my-3 space-y-2">
            {block.data.items.map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled
                  className="mt-1"
                />
                <span
                  className={item.checked ? "line-through text-gray-500" : ""}
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
              </div>
            ))}
          </div>
        );

      case "quote":
        return (
          <blockquote
            key={index}
            className="border-l-4 border-purple-500 pl-4 my-4 italic text-gray-700 dark:text-gray-300"
          >
            <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
            {block.data.caption && (
              <cite className="text-sm text-gray-500 not-italic">
                — {block.data.caption}
              </cite>
            )}
          </blockquote>
        );

      case "code":
        return (
          <pre
            key={index}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto"
          >
            <code className="text-sm">{block.data.code}</code>
          </pre>
        );

      case "delimiter":
        return (
          <div key={index} className="flex items-center justify-center my-8">
            <div className="flex gap-2">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        );

      case "table":
        return (
          <div key={index} className="overflow-x-auto my-4">
            <table className="min-w-full border border-gray-300 dark:border-gray-700">
              <tbody>
                {block.data.content.map((row: string[], rowIndex: number) => (
                  <tr
                    key={rowIndex}
                    className={
                      rowIndex === 0 ? "bg-gray-100 dark:bg-gray-800" : ""
                    }
                  >
                    {row.map((cell: string, cellIndex: number) => (
                      <td
                        key={cellIndex}
                        className="border border-gray-300 dark:border-gray-700 px-4 py-2"
                        dangerouslySetInnerHTML={{ __html: cell }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "embed":
        return (
          <div key={index} className="my-4">
            <iframe
              src={block.data.embed}
              width={block.data.width || "100%"}
              height={block.data.height || 400}
              className="w-full rounded-lg"
              frameBorder="0"
              allowFullScreen
            />
            {block.data.caption && (
              <p className="text-sm text-gray-500 text-center mt-2">
                {block.data.caption}
              </p>
            )}
          </div>
        );

      case "linkTool":
        return (
          <a
            key={index}
            href={block.data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block my-4 p-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {block.data.meta?.image?.url && (
              <img
                src={block.data.meta.image.url}
                alt={block.data.meta.title || "Link"}
                className="w-full h-48 object-cover rounded-lg mb-3"
              />
            )}
            <div className="font-semibold text-blue-600 dark:text-blue-400">
              {block.data.meta?.title || block.data.link}
            </div>
            {block.data.meta?.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {block.data.meta.description}
              </p>
            )}
          </a>
        );

      case "image":
        return (
          <div key={index} className="my-4">
            <img
              src={block.data.file?.url || block.data.url}
              alt={block.data.caption || ""}
              className="w-full rounded-lg"
            />
            {block.data.caption && (
              <p className="text-sm text-gray-500 text-center mt-2">
                {block.data.caption}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="prose prose-sm lg:prose-base dark:prose-invert max-w-none">
      {normalizedData.blocks.map((block: any, index: number) =>
        renderBlock(block, index)
      )}
    </div>
  );
};

export default memo(EditorJSRenderer);
