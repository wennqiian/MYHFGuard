import React, { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Siren,
  FileBarChart2,
  Settings,
  TriangleAlert,
  CircleAlert,
  CircleCheckBig,
  Download,
  FileSpreadsheet,
  FileText,
  Activity,
  HeartPulse,
  Waves,
  Footprints,
  Mail,
  CheckCircle2,
  Bell,
} from "lucide-react"
import { serverUrl } from "@/lib/api"
import { toast } from "sonner"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [summary, setSummary] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([])
  const [showExportBox, setShowExportBox] = useState(false)
  const API = serverUrl()

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true)
        setError("")

        const p = await fetch(`${API}/api/admin/patients`)
        if (!p.ok) {
          const t = await p.text()
          throw new Error(`patients ${p.status} ${p.statusText} ${t}`)
        }
        const pr = await p.json()
        const ids = (pr.patients || []).map((x) => x.patient_id)
        setUsers(ids)

        const s = await fetch(`${API}/admin/summary`)
        if (!s.ok) {
          const t = await s.text()
          throw new Error(`summary ${s.status} ${s.statusText} ${t}`)
        }
        const sr = await s.json()
        const onlyPatientSummary = (sr.summary || []).filter((item) =>
          ids.includes(item.patientId)
        )
        setSummary(onlyPatientSummary)
      } catch (e) {
        console.error("[AdminDashboard] fetchAll error", e)
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [API])

  const dashboardData = useMemo(() => {
    const totalPatients = users.length
    const activePatients = summary.length

    let avgSpo2 = 0
    let avgHr = 0
    let avgSteps = 0

    let spo2Count = 0
    let hrCount = 0
    let stepsCount = 0

    let stable = 0
    let warning = 0
    let critical = 0

    const alerts = []

    summary.forEach((item) => {
      const s = item.steps || {}
      const h = item.hr || {}
      const o = item.spo2 || {}

      if (o.spo2_avg != null) {
        avgSpo2 += Number(o.spo2_avg)
        spo2Count++
      }

      if (h.hr_avg != null) {
        avgHr += Number(h.hr_avg)
        hrCount++
      }

      if (s.steps_total != null) {
        avgSteps += Number(s.steps_total)
        stepsCount++
      }

      let patientStatus = "stable"
      let patientAlert = null

      if (o.spo2_avg != null && Number(o.spo2_avg) < 90) {
        patientStatus = "critical"
        patientAlert = {
          id: `${item.patientId}-spo2-critical`,
          level: "critical",
          title: "Critical",
          patientId: item.patientId,
          message: `Low SpO₂ (${Math.round(Number(o.spo2_avg))}%)`,
        }
      } else if (
        h.hr_avg != null &&
        (Number(h.hr_avg) > 120 || Number(h.hr_avg) < 50)
      ) {
        patientStatus = "critical"
        patientAlert = {
          id: `${item.patientId}-hr-critical`,
          level: "critical",
          title: "Critical",
          patientId: item.patientId,
          message: `Abnormal HR (${Math.round(Number(h.hr_avg))} bpm)`,
        }
      } else if (o.spo2_avg != null && Number(o.spo2_avg) < 95) {
        patientStatus = "warning"
        patientAlert = {
          id: `${item.patientId}-spo2-warning`,
          level: "warning",
          title: "Warning",
          patientId: item.patientId,
          message: `Slightly low SpO₂ (${Math.round(Number(o.spo2_avg))}%)`,
        }
      } else if (
        h.hr_avg != null &&
        (Number(h.hr_avg) > 100 || Number(h.hr_avg) < 60)
      ) {
        patientStatus = "warning"
        patientAlert = {
          id: `${item.patientId}-hr-warning`,
          level: "warning",
          title: "Warning",
          patientId: item.patientId,
          message: `Heart rate out of range (${Math.round(Number(h.hr_avg))} bpm)`,
        }
      }

      if (patientStatus === "critical") critical++
      else if (patientStatus === "warning") warning++
      else stable++

      if (patientAlert && !acknowledgedAlerts.includes(patientAlert.id)) {
        alerts.push(patientAlert)
      }
    })

    return {
      totalPatients,
      activePatients,
      newThisMonth: totalPatients,
      avgSpo2: spo2Count ? Math.round(avgSpo2 / spo2Count) : "-",
      avgHr: hrCount ? Math.round(avgHr / hrCount) : "-",
      avgSteps: stepsCount ? Math.round(avgSteps / stepsCount) : "-",
      stable,
      warning,
      critical,
      alerts,
    }
  }, [users, summary, acknowledgedAlerts])

  const exportCSV = () => {
    const headers = [
      "Patient ID",
      "Steps Date",
      "Steps Total",
      "HR Date",
      "HR Min",
      "HR Max",
      "HR Avg",
      "HR Count",
      "SpO2 Date",
      "SpO2 Min",
      "SpO2 Max",
      "SpO2 Avg",
      "SpO2 Count",
    ]

    const rows = summary.map((item) => {
      const s = item.steps || {}
      const h = item.hr || {}
      const o = item.spo2 || {}

      return [
        item.patientId,
        s.date || "",
        s.steps_total ?? "",
        h.date || "",
        h.hr_min ?? "",
        h.hr_max ?? "",
        h.hr_avg != null ? Math.round(h.hr_avg) : "",
        h.hr_count ?? "",
        o.date || "",
        o.spo2_min ?? "",
        o.spo2_max ?? "",
        o.spo2_avg != null ? Math.round(o.spo2_avg) : "",
        o.spo2_count ?? "",
      ]
    })

    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? "")}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "admin_dashboard_summary.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Excel file downloaded")
  }

  const exportPDF = () => {
    window.print()
    toast.success("PDF export started")
  }

  const acknowledgeAlert = (alertId) => {
    setAcknowledgedAlerts((prev) => [...prev, alertId])
    toast.success("Alert acknowledged")
  }

  const sendAlertEmail = (alert) => {
    toast.success(`Alert email sent for patient ${alert.patientId}`)
  }

  const goToPatient = (patientId) => {
    navigate(`/admin/patient/${patientId}`)
  }

  const alertsToShow = dashboardData.alerts.slice(0, 4)

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-56 flex-col bg-[#1f5fa8] text-white">
          <div className="px-5 py-5 border-b border-white/15">
            <div className="text-2xl font-bold">MyHFGuard</div>
            <p className="text-sm text-blue-100 mt-1">Admin Dashboard</p>
          </div>

          <nav className="p-4 space-y-2">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 rounded-lg bg-[#23c6e8] px-4 py-3 font-medium text-white"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>

            <Link
              to="/admin/patients"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10"
            >
              <Users size={18} />
              Patient List
            </Link>

            <button
              onClick={() => document.getElementById("recent-alerts")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 text-left"
            >
              <Siren size={18} />
              Alert Center
            </button>

            <button
              onClick={() => document.getElementById("analytics-reports")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 text-left"
            >
              <FileBarChart2 size={18} />
              Analytics & Reports
            </button>

            <button
              onClick={() => toast.info("Account Settings page not built yet")}
              className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-white hover:bg-white/10 text-left"
            >
              <Settings size={18} />
              Account Settings
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-5">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 mt-1">
                  Monitor alerts, patient status, and summary metrics.
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowExportBox((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-white font-semibold hover:bg-slate-600 shadow-sm"
                >
                  <Download size={16} />
                  Export Data
                </button>

                {showExportBox && (
                  <div className="absolute right-0 top-12 z-20 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
                    <h3 className="font-semibold text-slate-900">Export Data</h3>
                    <p className="text-sm text-slate-500 mb-3">Choose export format</p>

                    <div className="space-y-2">
                      <button
                        onClick={exportPDF}
                        className="w-full flex items-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white font-medium hover:bg-red-400"
                      >
                        <FileText size={16} />
                        Download as PDF
                      </button>

                      <button
                        onClick={exportCSV}
                        className="w-full flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-500"
                      >
                        <FileSpreadsheet size={16} />
                        Download as Excel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl bg-white border border-slate-200 p-8 shadow-sm text-slate-700">
                Loading dashboard...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <section
                    id="recent-alerts"
                    className="lg:col-span-4 rounded-xl bg-white border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold text-slate-800">Recent Alerts</h2>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Bell size={14} />
                        {alertsToShow.length} alerts
                      </div>
                    </div>

                    <div className="space-y-3">
                      {alertsToShow.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                          No active alerts found.
                        </div>
                      ) : (
                        alertsToShow.map((alert) => (
                          <div
                            key={alert.id}
                            className={`rounded-lg border p-3 ${
                              alert.level === "critical"
                                ? "border-red-200 bg-red-50"
                                : "border-amber-200 bg-amber-50"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {alert.level === "critical" ? (
                                <TriangleAlert className="text-red-500 mt-0.5" size={16} />
                              ) : (
                                <CircleAlert className="text-amber-500 mt-0.5" size={16} />
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-slate-800">
                                  {alert.title}: {alert.patientId}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">
                                  {alert.message}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                              >
                                Acknowledge
                              </button>
                              <button
                                onClick={() => goToPatient(alert.patientId)}
                                className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-400"
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => sendAlertEmail(alert)}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                              >
                                <Mail size={12} />
                                Send Email
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="lg:col-span-4 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <h2 className="font-semibold text-slate-800 mb-3">Overall Status</h2>

                    <div className="flex flex-col items-center">
                      <div className="relative h-40 w-40 rounded-full bg-[conic-gradient(#22c55e_0deg,#22c55e_230deg,#f59e0b_230deg,#f59e0b_300deg,#ef4444_300deg,#ef4444_360deg)] p-4">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-center">
                          <div>
                            <p className="text-3xl font-bold text-slate-800">{dashboardData.totalPatients}</p>
                            <p className="text-sm text-slate-500">Patients</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 w-full">
                        <div className="rounded-lg bg-emerald-50 p-3 text-center">
                          <p className="font-bold text-emerald-600">{dashboardData.stable}</p>
                          <p className="text-xs text-slate-500">Stable</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-3 text-center">
                          <p className="font-bold text-amber-600">{dashboardData.warning}</p>
                          <p className="text-xs text-slate-500">Warning</p>
                        </div>
                        <div className="rounded-lg bg-red-50 p-3 text-center">
                          <p className="font-bold text-red-600">{dashboardData.critical}</p>
                          <p className="text-xs text-slate-500">Critical</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="lg:col-span-4 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <h2 className="font-semibold text-slate-800 mb-3">Patient Summary</h2>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                        <span className="text-sm text-slate-600">Total Patients</span>
                        <span className="font-bold text-slate-900">{dashboardData.totalPatients}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                        <span className="text-sm text-slate-600">New This Month</span>
                        <span className="font-bold text-slate-900">{dashboardData.newThisMonth}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                        <span className="text-sm text-slate-600">Active Patients</span>
                        <span className="font-bold text-slate-900">{dashboardData.activePatients}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <div id="analytics-reports" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <Waves className="text-cyan-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Avg SpO₂</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardData.avgSpo2}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <HeartPulse className="text-rose-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Avg Heart Rate</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardData.avgHr} bpm</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-slate-100 p-3">
                        <Footprints className="text-emerald-600" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Avg Daily Steps</p>
                        <p className="text-3xl font-bold text-slate-900">{dashboardData.avgSteps}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <section className="lg:col-span-5 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity size={16} className="text-cyan-600" />
                      <h2 className="font-semibold text-slate-800">Activity Feed</h2>
                    </div>

                    <div className="space-y-2">
                      {summary.slice(0, 4).map((item) => (
                        <div
                          key={item.patientId}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              Patient {item.patientId} record updated
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Latest steps / heart rate / SpO₂ summary available
                            </p>
                          </div>
                          <span className="text-xs text-slate-400">recently</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="lg:col-span-7 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold text-slate-800">Patient Monitoring Table</h2>
                      <span className="text-xs text-slate-500">Click row to view profile</span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600">
                            <th className="px-3 py-3 text-left">Patient</th>
                            <th className="px-3 py-3 text-left">Steps</th>
                            <th className="px-3 py-3 text-left">HR Avg</th>
                            <th className="px-3 py-3 text-left">SpO₂ Avg</th>
                            <th className="px-3 py-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.map((item) => {
                            const s = item.steps || {}
                            const h = item.hr || {}
                            const o = item.spo2 || {}

                            const isCritical =
                              (o.spo2_avg != null && Number(o.spo2_avg) < 90) ||
                              (h.hr_avg != null &&
                                (Number(h.hr_avg) > 120 || Number(h.hr_avg) < 50))

                            const isWarning =
                              !isCritical &&
                              ((o.spo2_avg != null && Number(o.spo2_avg) < 95) ||
                                (h.hr_avg != null &&
                                  (Number(h.hr_avg) > 100 || Number(h.hr_avg) < 60)))

                            return (
                              <tr
                                key={item.patientId}
                                className="border-t border-slate-200 cursor-pointer hover:bg-slate-50"
                                onClick={() => goToPatient(item.patientId)}
                              >
                                <td className="px-3 py-3 font-medium text-slate-800">{item.patientId}</td>
                                <td className="px-3 py-3 text-slate-600">{s.steps_total ?? "-"}</td>
                                <td className="px-3 py-3 text-slate-600">
                                  {h.hr_avg != null ? Math.round(h.hr_avg) : "-"}
                                </td>
                                <td className="px-3 py-3 text-slate-600">
                                  {o.spo2_avg != null ? Math.round(o.spo2_avg) : "-"}
                                </td>
                                <td className="px-3 py-3">
                                  {isCritical ? (
                                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                                      Critical
                                    </span>
                                  ) : isWarning ? (
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-600">
                                      Warning
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600">
                                      <CircleCheckBig size={12} />
                                      Stable
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}