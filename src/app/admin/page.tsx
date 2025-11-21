"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import AdminPostsPage from "./posts/page";
import AdminInquiriesPage from "./inquiries/page";

export default function AdminIndex() {
  const [tab, setTab] = useState<"posts" | "inquiries">("posts");

  return (
    <Container>
      <div className="py-6 px-4">
        <div className="mb-6">
          <div role="tablist" aria-label="Admin tabs" className="inline-flex rounded-full p-1 surface">
            <button
              id="tab-posts"
              role="tab"
              aria-selected={tab === "posts"}
              aria-controls="panel-posts"
              onClick={() => setTab("posts")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-400 ${
                tab === "posts"
                  ? "bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400"
              }`}
            >
              포스트 관리
            </button>
            <button
              id="tab-inquiries"
              role="tab"
              aria-selected={tab === "inquiries"}
              aria-controls="panel-inquiries"
              onClick={() => setTab("inquiries")}
              className={`ml-1 px-4 py-2 rounded-full text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-400 ${
                tab === "inquiries"
                  ? "bg-linear-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400"
              }`}
            >
              문의 관리
            </button>
          </div>
        </div>

        <div>
          <div id="panel-posts" role="tabpanel" aria-labelledby="tab-posts" hidden={tab !== "posts"}>
            <AdminPostsPage />
          </div>
          <div id="panel-inquiries" role="tabpanel" aria-labelledby="tab-inquiries" hidden={tab !== "inquiries"}>
            <AdminInquiriesPage />
          </div>
        </div>
      </div>
    </Container>
  );
}
