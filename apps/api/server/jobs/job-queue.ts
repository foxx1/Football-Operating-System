type JobHandler<TPayload> = (payload: TPayload) => Promise<void>;

interface JobDefinition<TPayload> {
  name: string;
  handler: JobHandler<TPayload>;
}

export class InMemoryJobQueue {
  private handlers = new Map<string, JobHandler<unknown>>();

  register<TPayload>(definition: JobDefinition<TPayload>) {
    this.handlers.set(definition.name, definition.handler as JobHandler<unknown>);
  }

  async enqueue<TPayload>(name: string, payload: TPayload) {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No job handler registered for ${name}`);
    }

    setImmediate(() => {
      handler(payload).catch((error) => {
        console.error(`Background job failed: ${name}`, error);
      });
    });
  }
}

export const jobQueue = new InMemoryJobQueue();

export function registerBackgroundJobs() {
  jobQueue.register({
    name: "reports.generate",
    handler: async (payload) => {
      console.log("Queued report generation", payload);
    },
  });

  jobQueue.register({
    name: "wearables.sync",
    handler: async (payload) => {
      console.log("Queued wearable sync", payload);
    },
  });

  jobQueue.register({
    name: "webhooks.process",
    handler: async (payload) => {
      console.log("Queued webhook processing", payload);
    },
  });
}
