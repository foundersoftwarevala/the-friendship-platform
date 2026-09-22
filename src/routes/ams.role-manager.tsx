import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/ams/tickets/role-manager")({
  component: () => <Outlet />,
});
