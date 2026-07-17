/**
 * Client helpers for Tech Academy Cloud Functions (unused until deployed).
 * Used once minFirebaseEnabled is true and Auth is wired in minApp.js.
 */
import { minFirebaseEnabled, minFunctionsBase } from "./minFirebaseConfig.js";

async function postJson(path, body, idToken) {
  const headers = { "Content-Type": "application/json" };
  if (idToken) headers.Authorization = "Bearer " + idToken;

  const res = await fetch(minFunctionsBase + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });

  const data = await res.json().catch(function () {
    return {};
  });

  if (!res.ok) {
    const err = new Error(data.error || "request_failed");
    err.code = data.error;
    err.status = res.status;
    throw err;
  }

  return data;
}

export function isMinServerLive() {
  return minFirebaseEnabled === true;
}

/** Start Stripe Checkout for a paid tier (requires signed-in user). */
export async function createSubscriptionCheckout(tierId, idToken, options) {
  if (!isMinServerLive()) throw new Error("min_server_not_enabled");
  return postJson(
    "/createMinSubscriptionCheckout",
    {
      tierId,
      successPath: (options && options.successPath) || "/techApp.html",
      cancelPath: (options && options.cancelPath) || "/techApp.html#subscribe",
    },
    idToken,
  );
}

/** Open Stripe Customer Portal (manage / cancel subscription). */
export async function createBillingPortal(idToken, options) {
  if (!isMinServerLive()) throw new Error("min_server_not_enabled");
  return postJson(
    "/createMinBillingPortal",
    {
      returnPath: (options && options.returnPath) || "/techApp.html#subscribe",
    },
    idToken,
  );
}

/** After redirect ?min=sub_ok&session_id=… — confirm tier synced. */
export async function syncSubscriptionAfterCheckout(sessionId) {
  if (!isMinServerLive()) throw new Error("min_server_not_enabled");
  return postJson("/syncMinSubscription", { sessionId });
}
