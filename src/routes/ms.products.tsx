import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ProductsPage } from "./products";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/ms/products")({ component: MalayProductsPage });
function MalayProductsPage() { const { setLang } = useLang(); useEffect(() => setLang("ms"), [setLang]); return <ProductsPage />; }
