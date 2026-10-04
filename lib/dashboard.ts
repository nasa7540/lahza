import "server-only";
import { gate } from "@/lib/auth/gate";

export const dashboardGate = gate<{ in: true }>({ cookie: "lahza_dashboard", env: "DASHBOARD_PASSCODE", path: "/dashboard" });
