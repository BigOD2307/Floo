import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { isGatewayAuthenticated } from "@/lib/gateway-auth"
import { generateChart, type ChartType } from "@/lib/chart-generate"

/**
 * POST /api/tools/chart
 * Génère un graphique (bar, line, pie, doughnut).
 * Auth: session NextAuth ou X-Floo-Gateway-Key (gateway).
 * Body: { type, title?, labels, data }
 */
export async function POST(req: Request) {
  try {
    const gatewayOk = isGatewayAuthenticated(req)
    if (!gatewayOk) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
      }
    }

    const body = await req.json().catch(() => ({}))
    const type = (body?.type as string) || "bar"
    const validTypes: ChartType[] = ["bar", "line", "pie", "doughnut"]
    const chartType = validTypes.includes(type as ChartType)
      ? (type as ChartType)
      : "bar"
    const title = typeof body?.title === "string" ? body.title : ""
    const labelsRaw = body?.labels
    const dataRaw = body?.data

    const labels = Array.isArray(labelsRaw)
      ? (labelsRaw as unknown[]).map(String).filter(Boolean)
      : []
    const data = Array.isArray(dataRaw)
      ? (dataRaw as unknown[]).map((x) => Number(x)).filter((n) => !Number.isNaN(n))
      : []

    if (labels.length === 0 || data.length === 0 || labels.length !== data.length) {
      return NextResponse.json(
        {
          error:
            "Paramètres 'labels' et 'data' requis (tableaux de même longueur)",
        },
        { status: 400 }
      )
    }

    const result = await generateChart(chartType, title, labels, data)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Échec génération graphique" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, chartUrl: result.chartUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: "Erreur génération graphique",
        details: process.env.NODE_ENV === "development" ? msg : undefined,
      },
      { status: 500 }
    )
  }
}
