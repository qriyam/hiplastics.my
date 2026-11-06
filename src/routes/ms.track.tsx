import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { TrackPage } from "./track";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/ms/track")({ component: MalayTrackPage });
function MalayTrackPage() { const { setLang } = useLang(); useEffect(() => setLang("ms"), [setLang]); return <TrackPage />; }
