import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { postWaterSalt, getWaterSaltLogs } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

export default function WaterSalt() {
  const { t } = useTranslation()
  const [water, setWater] = useState("")
  const [salt, setSalt] = useState("")
  const [loading, setLoading] = useState(false)
  const [patientId, setPatientId] = useState<string>("")

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data?.session?.user?.id || ""
      setPatientId(uid)
    }
    loadSession()
  }, [])

  const logsQuery = useQuery({
    queryKey: ["water-salt-logs", patientId],
    queryFn: () => getWaterSaltLogs(patientId, 14),
    enabled: !!patientId,
    refetchOnWindowFocus: false,
  })

  const chartData = useMemo(() => {
    return (logsQuery.data?.logs || [])
      .slice()
      .reverse()
      .map((item) => ({
        date: new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        water: Number(item.water_intake || 0),
        salt: Number(item.salt_intake || 0),
      }))
  }, [logsQuery.data])

  const latestWater = chartData.length ? chartData[chartData.length - 1].water : 0
  const latestSalt = chartData.length ? chartData[chartData.length - 1].salt : 0

  const handleSubmit = async () => {
    if (!patientId) {
      toast.error(t("waterDiet.loginFirst", "Please log in first"))
      return
    }

    if (!water || !salt) {
      toast.error(t("waterDiet.enterBoth", "Please enter both water and salt intake"))
      return
    }

    try {
      setLoading(true)
      await postWaterSalt({
        patient_id: patientId,
        water_intake: Number(water),
        salt_intake: Number(salt),
        date: new Date().toISOString(),
      })

      if (Number(salt) > 2000) {
        toast.warning(t("waterDiet.warningHighSalt"))
      }
      if (Number(water) > 2000) {
        toast.warning(t("waterDiet.warningHighWater"))
      }

      toast.success(t("waterDiet.success"))
      setWater("")
      setSalt("")
      logsQuery.refetch()
    } catch (err) {
      toast.error(t("waterDiet.saveFailed", "Failed to save water and salt intake"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">{t("waterDiet.title")}</h1>
        <p className="text-muted-foreground">{t("waterDiet.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("waterDiet.dailyRecord")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">{t("waterDiet.waterIntake")} ({t("waterDiet.waterUnit")})</label>
              <Input type="number" value={water} onChange={(e) => setWater(e.target.value)} placeholder={t("waterDiet.enterWater")} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t("waterDiet.saltIntake")} ({t("waterDiet.saltUnit")})</label>
              <Input type="number" value={salt} onChange={(e) => setSalt(e.target.value)} placeholder={t("waterDiet.enterSalt")} />
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? t("common.loading") : t("common.save")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("waterDiet.summaryTitle", "Latest Summary")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">{t("waterDiet.waterIntake")}</p>
              <p className="mt-2 text-3xl font-bold">{latestWater} {t("waterDiet.waterUnit")}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">{t("waterDiet.saltIntake")}</p>
              <p className="mt-2 text-3xl font-bold">{latestSalt} {t("waterDiet.saltUnit")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("waterDiet.waterGraph", "Water Intake Graph")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="water" name={t("waterDiet.waterIntake")} stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("waterDiet.saltGraph", "Salt Intake Graph")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="salt" name={t("waterDiet.saltIntake")} stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
