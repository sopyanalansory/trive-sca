import { NextRequest, NextResponse } from "next/server"
import { getCorsHeaders } from "@/lib/cors"

export function middleware(request: NextRequest) {
    const origin = request.headers.get("origin")

    if (request.method === "OPTIONS") {
        return new NextResponse(null, {
            status: 204,
            headers: getCorsHeaders(origin),
        })
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
