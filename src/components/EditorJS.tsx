"use client";
import { useEffect, useRef, memo, useId } from "react";

interface EditorJSProps {
  value?: any;
  onChange?: (data: any) => void;
  placeholder?: string;
}

const EditorJSComponent = ({ value, onChange, placeholder }: EditorJSProps) => {
  const editorRef = useRef<any>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const uid = useId();

  useEffect(() => {
    if (!holderRef.current || isInitializedRef.current) return;
    // Ensure only one Editor.js instance exists across the page during HMR/hydration
    if (typeof window !== "undefined") {
      try {
        const prev = (window as any).__editorjs_instance;
        if (prev) {
          // If previous instance exposes destroy, call it immediately
          if (typeof prev.destroy === "function") {
            try {
              prev.destroy();
            } catch (e) {
              // ignore
            }
          } else if (prev.isReady && typeof prev.isReady.then === "function") {
            // If previous instance is still initializing (has isReady Promise), wait and then destroy if available
            try {
              prev.isReady
                .then(() => {
                  try {
                    if (typeof prev.destroy === "function") prev.destroy();
                  } catch (e) {
                    // ignore
                  }
                })
                .catch(() => {});
            } catch (e) {}
          }
        }
        // clear any previous reference
        (window as any).__editorjs_instance = null;
      } catch (e) {}
    }
    try {
      console.debug(`EditorJS useEffect mount uid=${uid}, holderExists=${!!holderRef.current}`);
    } catch (e) {}

    // 동적 import로 Editor.js 로드
    const initEditor = async () => {
      // If a global instance exists (from HMR/hydration), wait for it to be ready and destroy it first.
      if (typeof window !== "undefined") {
        try {
          const prev = (window as any).__editorjs_instance;
          if (prev) {
            // wait for initialization if in progress
            if (prev.isReady && typeof prev.isReady.then === "function") {
              try {
                await prev.isReady;
              } catch (e) {
                // ignore
              }
            }

            if (typeof prev.destroy === "function") {
              try {
                await prev.destroy();
              } catch (e) {
                // ignore
              }
            }

            try {
              (window as any).__editorjs_instance = null;
              (window as any).__editorjs_uid = null;
            } catch (e) {}
          }
        } catch (e) {}
      }

      const EditorJS = (await import("@editorjs/editorjs")).default;
      const Header = (await import("@editorjs/header")).default;
      const List = (await import("@editorjs/list")).default;
      const Code = (await import("@editorjs/code")).default;
      const ImageTool = (await import("@editorjs/image")).default;
      const Quote = (await import("@editorjs/quote")).default;
      const Delimiter = (await import("@editorjs/delimiter")).default;
      const Table = (await import("@editorjs/table")).default;
      const Checklist = (await import("@editorjs/checklist")).default;
      const Embed = (await import("@editorjs/embed")).default;
      const LinkTool = (await import("@editorjs/link")).default;
      const Stub = (await import("../lib/editor-tools/stub")).default;

      // 기존 에디터가 있으면 제거 (destroy가 함수인 경우에만 호출)
      if (editorRef.current) {
        try {
          console.debug("EditorJS init: previous editorRef:", editorRef.current);
        } catch (e) {}

        // If destroy exists, call it. Otherwise, if an isReady promise exists,
        // wait for readiness and then attempt to destroy to avoid race conditions.
        if (typeof editorRef.current.destroy === "function") {
          try {
            await editorRef.current.destroy();
          } catch (e) {
            console.error("Error destroying previous editor instance:", e);
          }
        } else if (editorRef.current && editorRef.current.isReady && typeof editorRef.current.isReady.then === 'function') {
          try {
            await editorRef.current.isReady;
          } catch (e) {
            // ignore readiness errors
          }

          try {
            if (typeof editorRef.current.destroy === 'function') {
              await editorRef.current.destroy();
            }
          } catch (e) {
            // ignore destroy errors
          }
        } else {
          // Fallback: still no destroy and no isReady -- log diagnostic but continue.
          try {
            console.warn("EditorJS init: editorRef.current.destroy is not a function", editorRef.current);
          } catch (e) {}

          try {
            const payload = {
              phase: 'init',
              timestamp: new Date().toISOString(),
              location: typeof window !== 'undefined' ? window.location.href : null,
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
              typeofValue: typeof editorRef.current,
              constructorName:
                editorRef.current && editorRef.current.constructor
                  ? editorRef.current.constructor.name
                  : null,
              keys: editorRef.current && typeof editorRef.current === 'object' ? Object.keys(editorRef.current) : null,
              sample: editorRef.current,
            };

            fetch('/api/diagnostic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }).catch(() => {});
          } catch (e) {
            // ignore
          }
        }

        editorRef.current = null;
      }

      // 새 에디터 생성
      editorRef.current = new EditorJS({
        holder: holderRef.current!,
        placeholder: placeholder || "내용을 입력하세요...",
        data: value || { blocks: [] },
        onChange: async () => {
          if (onChange && editorRef.current) {
            const content = await editorRef.current.save();
            onChange(content);
          }
        },
        tools: {
          header: {
            class: Header as any,
            config: {
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2,
            },
          },
          list: {
            class: List as any,
            inlineToolbar: true,
          },
          checklist: {
            class: Checklist as any,
            inlineToolbar: true,
          },
          quote: {
            class: Quote as any,
            inlineToolbar: true,
            config: {
              quotePlaceholder: "인용문을 입력하세요",
              captionPlaceholder: "출처",
            },
          },
          code: {
            class: Code as any,
          },
          image: {
            class: ImageTool as any,
            config: {
              // only expose file upload endpoint; remote URL handling removed
              endpoints: {
                byFile: "/api/upload",
              },
              field: "image",
              types: "image/*",
              additionalRequestHeaders: {},
              // Provide uploader methods for file uploads only.
              uploader: {
                async uploadByFile(file: File) {
                  const form = new FormData();
                  form.append("image", file, file.name);
                  const res = await fetch("/api/upload", { method: "POST", body: form });
                  if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(txt || res.statusText);
                  }
                  return res.json();
                },
              },
            },
          },
          delimiter: Delimiter as any,
          table: {
            class: Table as any,
            inlineToolbar: true,
          },
          embed: {
            class: Embed as any,
            config: {
              services: {
                youtube: true,
                vimeo: true,
                codepen: true,
                twitter: true,
                github: true,
              },
            },
          },
          linkTool: {
            class: LinkTool as any,
            config: {
              endpoint: "/api/link", // 링크 메타데이터를 가져올 API (선택사항)
            },
          },
          // Stub 툴 추가: 알 수 없는 블록을 편집/삭제할 수 있게 함
          stub: {
            class: Stub as any,
            inlineToolbar: true,
          },
        },
        i18n: {
          messages: {
            ui: {
              blockTunes: {
                toggler: {
                  "Click to tune": "클릭하여 설정",
                },
              },
              inlineToolbar: {
                converter: {
                  "Convert to": "변환",
                },
              },
              toolbar: {
                toolbox: {
                  Add: "추가",
                },
              },
            },
            toolNames: {
              Text: "텍스트",
              Heading: "제목",
              List: "목록",
              Checklist: "체크리스트",
              Quote: "인용",
              Code: "코드",
              Delimiter: "구분선",
              Table: "표",
              Link: "링크",
              Bold: "굵게",
              Italic: "기울임",
            },
            tools: {
              link: {
                "Add a link": "링크 추가",
              },
              stub: {
                "The block can not be displayed correctly.":
                  "블록을 올바르게 표시할 수 없습니다.",
              },
            },
            blockTunes: {
              delete: {
                Delete: "삭제",
              },
              moveUp: {
                "Move up": "위로 이동",
              },
              moveDown: {
                "Move down": "아래로 이동",
              },
            },
          },
        },
      });

      try {
        console.debug(`EditorJS initialized uid=${uid}`, editorRef.current);
      } catch (e) {}

      // register global instance for cross-component HMR/hydration safety
      try {
        if (typeof window !== "undefined") {
          (window as any).__editorjs_instance = editorRef.current;
          (window as any).__editorjs_uid = uid;
        }
      } catch (e) {}

      isInitializedRef.current = true;
    };

    initEditor();

    // 클린업
    return () => {
      try {
        console.debug('EditorJS cleanup, editorRef:', editorRef.current);
      } catch (e) {}

      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        try {
          editorRef.current.destroy();
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
        editorRef.current = null;
      } else if (editorRef.current) {
        try {
          console.warn('EditorJS cleanup: editorRef exists but destroy is not a function', editorRef.current);
        } catch (e) {}
        editorRef.current = null;
      }

      isInitializedRef.current = false;
    };
  }, []);

  return (
    <div className="border-2 rounded-lg overflow-hidden surface">
      <div
        ref={holderRef}
        id={`editorjs-${uid}`}
        className="prose prose-sm lg:prose-base dark:prose-invert max-w-none p-4"
      />
    </div>
  );
};

export default memo(EditorJSComponent);
