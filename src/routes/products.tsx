import { RouteError } from "@/components/RouteError";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { site } from "@/lib/site";
import { usePublicData } from "@/hooks/usePublicData";

type ProductsSearch = { q?: string };

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>): ProductsSearch => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => {
    return {
      meta: [
        { title: `Products — ESL Rails, Shelf & Price Tag Holders | ${site.name}` },
        { name: "description", content: "Browse ESL rails, shelf label holders, price tag holders, display clips and retail signage accessories from Hiplastics Malaysia." },
        { property: "og:title", content: `Products — ${site.name}` },
        { property: "og:description", content: "Complete catalogue of retail display accessories." },
        { property: "og:url", content: "https://hiplastics.my/products" },
      ],
      links: [{ rel: "canonical", href: "https://hiplastics.my/products" }],
    };
  },
  errorComponent: ({ error }) => <RouteError error={error as Error} />,
  component: ProductsPage,
});

export function ProductsPage() {
  const { products: dbProducts, categories: dbCategories } = usePublicData();
  const { q } = Route.useSearch();
  const [category, setCategory] = useState("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState<"featured" | "price-low" | "price-high" | "name">("featured");
  const [page, setPage] = useState(1);
  const [compare, setCompare] = useState<string[]>([]);
  const pageSize = 12;

  // Only products uploaded from the admin panel are shown
  const allMerged = dbProducts.map((p) => {
    const imgs = (Array.isArray(p.image_urls) ? p.image_urls : []).filter(Boolean);
    const first = imgs[0] || p.image_url || "";
    return {
      slug: p.slug,
      name: p.name,
      category: p.category || "Uncategorised",
      description: p.description || "",
      features: Array.isArray(p.features) ? p.features : [],
      image: first,
      images: imgs.length ? imgs : (first ? [first] : []),
      price: Number((p as { price?: number }).price ?? 0),
      purchasable: Boolean((p as { is_purchasable?: boolean }).is_purchasable),
      stock: Math.max(0, Number((p as { stock?: number }).stock ?? 0)),
      sku: (p as { sku?: string }).sku || "",
      rating_average: p.rating_average,
      rating_count: p.rating_count,
      name_ms: p.name_ms,
      description_ms: p.description_ms,
      features_ms: p.features_ms,
      price_tiers: p.price_tiers,
    };
  });

  // Search filters across name, description, category and SKU.
  const needle = (q ?? "").trim().toLowerCase();
  const searched = needle
    ? allMerged.filter((p) =>
        [p.name, p.description, p.category, p.sku].some((f) => String(f ?? "").toLowerCase().includes(needle)),
      )
    : allMerged;

  const filtered = useMemo(() => {
    const result = searched.filter((p) => (category === "all" || p.category === category) && (!stockOnly || p.stock > 0));
    return [...result].sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "name" ? a.name.localeCompare(b.name) : 0);
  }, [searched, category, stockOnly, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleCompare(slug: string) {
    setCompare((current) => current.includes(slug) ? current.filter((s) => s !== slug) : current.length < 3 ? [...current, slug] : current);
  }

  function downloadDatasheet(product: (typeof allMerged)[number]) {
    const lines = [
      "HIPLASTICS MALAYSIA — PRODUCT DATASHEET", "", `Product: ${product.name}`, `SKU: ${product.sku || "—"}`, `Category: ${product.category}`,
      `Price: MYR ${product.price.toFixed(2)}`, `Stock: ${product.stock > 0 ? `${product.stock} available` : "Out of stock"}`, "", "DESCRIPTION", product.description || "—", "", "KEY FEATURES", ...product.features.map((f) => `• ${f}`), "", `Generated from ${site.name} catalogue`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${product.slug}-datasheet.txt`; a.click(); URL.revokeObjectURL(a.href);
  }

  const compareProducts = compare.map((slug) => allMerged.find((p) => p.slug === slug)).filter(Boolean) as typeof allMerged;

  // Prefer DB category order; append any extra categories found on products
  const orderedCats = dbCategories.map((c) => c.name);
  const extras = Array.from(new Set(searched.map((p) => p.category))).filter((c) => !orderedCats.includes(c));
  const categories = [...orderedCats.filter((c) => searched.some((p) => p.category === c)), ...extras];


  return (
    <SiteLayout>
      <section className="bg-hero">
        <div className="container-page py-14 lg:py-20">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Catalogue</span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {needle ? `Search results for "${q}"` : "Retail Display Products"}
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            {needle
              ? `${filtered.length} product${filtered.length === 1 ? "" : "s"} found.`
              : "Engineered display accessories for supermarkets, pharmacies, and retail chains. Request a quotation for any item below."}
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="container-page flex flex-wrap items-center gap-3 py-4">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="all">All categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="featured">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={stockOnly} onChange={(e) => { setStockOnly(e.target.checked); setPage(1); }} /> In stock only</label>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} products</span>
        </div>
      </section>

      {filtered.length === 0 && (
        <section className="section-pad">
          <div className="container-page text-center text-muted-foreground">
            No products matched your filters{needle ? ` for "${q}"` : ""}. Try changing the filters.
          </div>
        </section>
      )}

      {filtered.length > 0 && <section className="section-pad"><div className="container-page"><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visible.map((p) => <div key={p.slug} className="relative"><div className="absolute right-3 top-3 z-20 flex gap-1"><button type="button" onClick={() => toggleCompare(p.slug)} className={`rounded-md px-2 py-1 text-[11px] font-bold shadow-sm ${compare.includes(p.slug) ? "bg-primary text-primary-foreground" : "bg-background/95 text-foreground"}`}>{compare.includes(p.slug) ? "In compare" : "Compare"}</button><button type="button" onClick={() => downloadDatasheet(p)} className="rounded-md bg-background/95 px-2 py-1 text-[11px] font-bold text-foreground shadow-sm">Datasheet</button></div><ProductCard product={p} /></div>)}</div><div className="mt-8 flex items-center justify-center gap-4 text-sm"><button disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))} className="rounded-md border border-border px-3 py-2 font-semibold disabled:opacity-40">Previous</button><span className="text-muted-foreground">Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((n) => Math.min(pageCount, n + 1))} className="rounded-md border border-border px-3 py-2 font-semibold disabled:opacity-40">Next</button></div></div></section>}

      {compareProducts.length > 0 && <section className="border-t border-border bg-surface py-8"><div className="container-page"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-foreground">Compare products</h2><p className="text-xs text-muted-foreground">Select up to 3 products.</p></div><button type="button" onClick={() => setCompare([])} className="text-xs font-semibold text-muted-foreground underline">Clear</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-sm"><tbody>{(["name", "category", "sku", "price", "stock"] as const).map((field) => <tr key={field} className="border-b border-border"><th className="w-28 px-3 py-3 text-left text-xs uppercase text-muted-foreground">{field}</th>{compareProducts.map((p) => <td key={p.slug} className="px-3 py-3 font-semibold text-foreground">{field === "price" ? money(p.price) : field === "stock" ? (p.stock > 0 ? `${p.stock} available` : "Out of stock") : String(p[field] || "—")}</td>)}</tr>)}</tbody></table></div></div></section>}
    </SiteLayout>
  );
}
