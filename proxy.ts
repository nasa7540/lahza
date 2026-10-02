import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Locale routing only; api, embed, dashboard, eval and static files are not localized by prefix.
  matcher: ["/((?!api|embed|dashboard|eval|study|_next|_vercel|.*\\..*).*)"],
};
