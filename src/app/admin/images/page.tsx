import AdminImageUploader from "@/components/AdminImageUploader";
import Container from "@/components/ui/Container";

export const metadata = {
  title: "Admin - Images",
};

export default function AdminImagesPage() {
  return (
    <Container>
      <div className="py-6 px-4">
        <h1 className="text-xl font-semibold mb-4">이미지 관리</h1>

        <div className="max-w-4xl">
          <AdminImageUploader />
        </div>
      </div>
    </Container>
  );
}
