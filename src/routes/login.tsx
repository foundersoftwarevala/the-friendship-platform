import { createFileRoute } from "@tanstack/react-router";
import { CanonicalLogin } from "@/components/auth/CanonicalLogin";

/**
 * Somebody sent here from a page they were trying to use - a demo, most often -
 * should land back on that page once they are signed in, not on the home page.
 * Only a path on this site is accepted, so the parameter cannot be used to
 * bounce a visitor somewhere else.
 */
function destination(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const asked = new URLSearchParams(window.location.search).get("redirect") ?? "";
  return asked.startsWith("/") && !asked.startsWith("//") ? asked : undefined;
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Software Vala™" },
      {
        name: "description",
        content: "Sign in securely to access your Software Vala workspace and Control Panel.",
      },
      { property: "og:title", content: "Sign in — Software Vala™" },
      {
        property: "og:description",
        content: "Sign in securely to access your Software Vala workspace and Control Panel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <CanonicalLogin redirectTo={destination()} />,
});