async function post(path: string, body: unknown): Promise<void> {
  try {
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Notifications are best-effort — never block the user-facing action on email delivery.
  }
}

export function sendReviewNotification(params: { artisanId: number; reviewId: number }): void {
  void post("/api/notifications/review-created", params);
}

export function sendMessageNotification(params: { artisanId: number; customerId: string; senderId: string }): void {
  void post("/api/notifications/new-message", params);
}
