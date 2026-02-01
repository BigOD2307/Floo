/**
 * Génération de graphiques via QuickChart.io (gratuit, pas d'API key).
 * Types: bar, line, pie, doughnut.
 */

const QUICKCHART_BASE = "https://quickchart.io/chart"

export interface ChartGenerateResult {
  ok: boolean
  chartUrl?: string
  error?: string
}

export type ChartType = "bar" | "line" | "pie" | "doughnut"

export async function generateChart(
  type: ChartType,
  title: string,
  labels: string[],
  data: number[]
): Promise<ChartGenerateResult> {
  try {
    if (!labels.length || !data.length || labels.length !== data.length) {
      return {
        ok: false,
        error: "labels et data doivent être des tableaux non vides de même longueur",
      }
    }

    const chartConfig: Record<string, unknown> = {
      type,
      data: {
        labels: labels.slice(0, 20),
        datasets: [
          {
            label: title || "Données",
            data: data.slice(0, 20),
            backgroundColor:
              type === "pie" || type === "doughnut"
                ? [
                    "#00ffc4",
                    "#00d4aa",
                    "#00a88a",
                    "#007d6a",
                    "#00524a",
                    "#3b82f6",
                    "#8b5cf6",
                    "#ec4899",
                  ]
                : "rgba(0, 255, 196, 0.6)",
            borderColor: "#00ffc4",
            borderWidth: 1,
          },
        ],
      },
      options: {
        title: {
          display: Boolean(title),
          text: title || "",
          font: { size: 18 },
        },
        legend: { display: type === "pie" || type === "doughnut" },
        plugins: {
          datalabels: false,
        },
      },
    }

    const encoded = encodeURIComponent(JSON.stringify(chartConfig))
    const chartUrl = `${QUICKCHART_BASE}?c=${encoded}&width=600&height=400`

    return { ok: true, chartUrl }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
