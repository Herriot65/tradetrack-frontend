// A static-host fallback can return index.html with HTTP 200 for an API URL.
// Never accept that response as account data or a successful mutation.
export function requireJsonResponse(response) {
  const contentType = response.headers?.["content-type"] || "";
  if (!/^application\/(?:[\w.-]+\+)?json(?:\s*;|$)/i.test(contentType)) {
    throw Object.assign(new Error("The account service returned an invalid response."), {
      code: "INVALID_API_RESPONSE", response,
    });
  }
  return response;
}

export function requireUser(user) {
  if (!user || typeof user !== "object" || Array.isArray(user) ||
      !["number", "string"].includes(typeof user.id) || !user.id ||
      typeof user.email !== "string" || !user.email) {
    throw Object.assign(new Error("The account service returned an invalid user."), {
      code: "INVALID_API_RESPONSE",
    });
  }
  return user;
}
