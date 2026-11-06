import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { HomePage } from "./index";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/ms")({ component: MalayHomePage });
function MalayHomePage() { const { setLang } = useLang(); useEffect(() => setLang("ms"), [setLang]); return <HomePage />; }
