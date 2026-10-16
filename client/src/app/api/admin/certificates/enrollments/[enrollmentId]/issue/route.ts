
import {
  invalidAdminRoute,
  parsePositiveId,
  proxyAdminApi,
} from "@/lib/adminApiProxy";

type Context = {
  params: Promise<{ enrollmentId: string }>;
};

export async function POST(
  _request: Request,
  { params }: Context
) {
  const { enrollmentId: rawId } = await params;
  const enrollmentId = parsePositiveId(rawId);

  if (!enrollmentId) return invalidAdminRoute();

  return proxyAdminApi(
    "POST",
    `/api/admin/certificates/enrollments/${enrollmentId}/issue`
  );
}
