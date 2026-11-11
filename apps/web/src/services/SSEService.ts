export interface SSEProgressPayload {
  repositoryId: string;
  status: "PENDING" | "QUEUED" | "CLONING" | "ANALYZING" | "INDEXING" | "PROCESSING" | "COMPLETED" | "FAILED";
  currentStage: string;
  progress: number;
  currentMessage: string;
  estimatedRemainingTime?: string | null;
  startedAt?: string;
}

export interface SSEOptions {
  onMessage: (data: SSEProgressPayload) => void;
  onError?: (err: Event) => void;
  onOpen?: () => void;
}

export class SSEService {
  private eventSource: EventSource | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;
  private retryCount = 0;
  private maxRetries = 5;

  constructor(
    private repositoryId: string,
    private options: SSEOptions
  ) {}

  public async connect() {
    console.log("[SSE CONNECT]", this.repositoryId);
    this.closeEventSource();
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.isIntentionalClose = false;

    // Fetch Clerk auth token
    let token = "";
    try {
      if (typeof window !== "undefined") {
        const win = window as typeof window & { Clerk?: { session?: { getToken: () => Promise<string | null> } } };
        if (win.Clerk?.session) {
          const sessionToken = await win.Clerk.session.getToken();
          if (sessionToken) {
            token = sessionToken;
          }
        }
      }
    } catch (err) {
      console.error("[SSEService] Failed to retrieve Clerk token:", err);
    }

    if (this.isIntentionalClose) return;

    const queryParam = token ? `?token=${encodeURIComponent(token)}` : "";
    const url = `/api/v1/repositories/${this.repositoryId}/progress/stream${queryParam}`;

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log("[SSE OPEN]", this.repositoryId);
      this.retryCount = 0;
      if (this.options.onOpen) this.options.onOpen();
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE MESSAGE]", this.repositoryId, data);
        this.options.onMessage(data);
      } catch (err) {
        console.error("[SSEService] Failed to parse message chunk:", err);
      }
    };

    this.eventSource.onerror = (err) => {
      console.log("[SSE ERROR]", this.repositoryId, err);
      if (this.options.onError) this.options.onError(err);
      
      // Auto-reconnect if it wasn't explicitly closed by client
      if (!this.isIntentionalClose) {
        this.handleReconnect();
      }
    };
  }

  private handleReconnect() {
    this.closeEventSource();
    if (this.retryCount >= this.maxRetries) {
      console.warn(`[SSEService] Max reconnection retries (${this.maxRetries}) reached for repo ${this.repositoryId}`);
      return;
    }

    const backoff = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
    this.retryCount++;
    console.log(`[SSEService] Reconnecting in ${backoff}ms (retry ${this.retryCount}/${this.maxRetries})`);

    this.retryTimeout = setTimeout(() => {
      this.connect();
    }, backoff);
  }

  private closeEventSource() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  public close() {
    this.isIntentionalClose = true;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    console.log("[SSE CLOSED]", this.repositoryId);
    this.closeEventSource();
  }
}
