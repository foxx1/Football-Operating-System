import { describe, expect, it, vi } from "vitest";
import { InMemoryJobQueue } from "./job-queue";

describe("background job queue", () => {
  it("runs registered jobs asynchronously", async () => {
    const queue = new InMemoryJobQueue();
    const handler = vi.fn(async (_payload: { id: number }) => undefined);

    queue.register({ name: "reports.generate", handler });
    await queue.enqueue("reports.generate", { id: 7 });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledWith({ id: 7 });
    });
  });

  it("rejects unknown jobs", async () => {
    const queue = new InMemoryJobQueue();
    await expect(queue.enqueue("missing.job", {})).rejects.toThrow(/No job handler/);
  });
});
