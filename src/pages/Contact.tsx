import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, MessageSquare, Phone, Info, Mail } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function Contact() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">{t("helpSupport.title")}</h1>
        <p className="mb-6 text-muted-foreground">{t("helpSupport.subtitle")}</p>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                {t("helpSupport.aboutTitle", "About MyHFGuard")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("helpSupport.aboutBody", "MyHFGuard helps heart failure patients monitor symptoms, manage reminders, record daily health data and learn self-care more easily.")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {t("helpSupport.faq")}
              </CardTitle>
              <CardDescription>{t("helpSupport.faqDesc", "Find answers to common questions about heart failure and app usage.")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("helpSupport.faqBody", "For reliable medical FAQs, you can also read the Heart Failure Matters FAQ page.")}
              </p>
              <Button variant="outline" className="w-full justify-between" asChild>
                <a href="https://www.heartfailurematters.org/faq/frequently-asked-questions/" target="_blank" rel="noopener noreferrer">
                  {t("helpSupport.openFaq", "Open Heart Failure FAQ")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                {t("helpSupport.contactUs")}
              </CardTitle>
              <CardDescription>{t("helpSupport.needHelp")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border bg-muted/30 p-4">
                <Phone className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{t("helpSupport.emergencyContact")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("helpSupport.emergencyBody", "If you have a medical emergency, please contact your local emergency number immediately. Do not rely on this app for urgent treatment.")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-lg border bg-muted/30 p-4">
                <Mail className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{t("helpSupport.supportTitle", "App Support")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("helpSupport.supportBody", "For technical issues, please contact your lecturer, system administrator or healthcare team.")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
