import { proxy } from "@/lib/supabase/proxy";
import type { NextRequest } from "next/server";

export function proxyHandler(request: NextRequest) {
  return proxy(request);
}

export default proxyHandler;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};