import { proxyAdminApi } from "@/lib/adminApiProxy";

export async function GET() {
  return proxyAdminApi("GET", "/api/admin/payments");
}