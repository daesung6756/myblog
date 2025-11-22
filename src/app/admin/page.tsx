import { redirect } from "next/navigation";

export default function AdminIndex() {
  // Server-side redirect to the posts management page.
  redirect("/admin/posts");
}
