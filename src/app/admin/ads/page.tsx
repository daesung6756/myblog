import AdminAdsManager from "@/components/AdminAdsManager";
import Container from "@/components/ui/Container";

export const metadata = {
  title: "Admin - Ads",
};

export default function AdminAdsPage() {
  return (
    <Container>
      <div className="py-6 px-4">
        <h1 className="text-xl font-semibold mb-4">광고 관리</h1>

        <div className="max-w-4xl">
          <AdminAdsManager />
        </div>
      </div>
    </Container>
  );
}
