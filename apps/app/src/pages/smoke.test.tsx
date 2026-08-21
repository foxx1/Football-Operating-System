import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/contexts/I18nContext";
import LoginPage from "./login";

vi.mock("wouter", () => ({
  useLocation: () => ["/login", vi.fn()],
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        {ui}
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe("frontend smoke tests", () => {
  it("renders the login page", () => {
    renderWithQueryClient(<LoginPage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});
