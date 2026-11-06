import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ContactPage } from "./contact";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/ms/contact")({ component: MalayContactPage });
function MalayContactPage() { const { setLang } = useLang(); useEffect(() => setLang("ms"), [setLang]); return <ContactPage />; }
