
import {
  invalidAdminRoute,
  proxyAdminApi,
} from "@/lib/adminApiProxy";

type Context = {
  params: Promise<{ number: string }>;
};

export async function GET(
  _request: Request,
  { params }: Context
) {
  const { number } = await params;

  const normalized = number.trim().toUpperCase();

  if (
    normalized.length < 4 ||
    normalized.length > 100 ||
    !/^[A-Z0-9-]+$/.test(normalized)
  ) {
    return invalidAdminRoute();
  }

  return proxyAdminApi(
    "GET",
    `/api/certificates/verify/${encodeURIComponent(normalized)}`
  );
}
