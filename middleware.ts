import { NextRequest, NextResponse, NextFetchEvent } from "next/server"
import { getCorsHeaders } from "@/lib/cors"
import { enforceApiIpLimit } from "@/lib/rate-limit"

export async function middleware(request: NextRequest, event: NextFetchEvent) {
    const origin = request.headers.get("origin")

    if (request.method === "OPTIONS") {
        return new NextResponse(null, {
            status: 204,
            headers: getCorsHeaders(origin),
        })
    }

    const { response: ipLimited, pending } = await enforceApiIpLimit(request)
    if (pending) {
        event.waitUntil(pending)
    }
    if (ipLimited) {
        return ipLimited
    }

    const response = NextResponse.next()
    const cors = getCorsHeaders(origin)
    for (const [key, value] of Object.entries(cors)) {
        response.headers.set(key, value)
    }
    return response
}

export const config = {
    matcher: "/api/:path*",
}
