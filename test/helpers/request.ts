import { NextRequest } from "next/server";

export function postJson(
  pathname: string,
  body: unknown,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(`http://localhost${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  });
}

export function getReq(
  urlWithQuery: string,
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(`http://localhost${urlWithQuery}`, {
    method: "GET",
    headers: headers ?? {},
  });
}

export function basicAuthHeader(user: string, pass: string): Record<string, string> {
  const token = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
  return { Authorization: `Basic ${token}` };
}
