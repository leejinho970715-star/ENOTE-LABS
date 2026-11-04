import { productInfo, type ProductKind } from "../lib/studio-domain";
export const studioOrigin = "https://enote-labs.vercel.app";
export function productMetadata(kind: ProductKind, workspace = false) {
  const p = productInfo[kind],
    path = "/" + kind + (workspace ? "/workspace/" : "/");
  return {
    metadataBase: new URL(studioOrigin),
    title: {
      absolute: `${p.name} — ${workspace ? "워크스페이스" : p.description}`,
    },
    description: p.description,
    alternates: { canonical: studioOrigin + path },
    robots: { index: !workspace, follow: true },
    icons: {
      icon: [
        { url: "/product-assets/" + kind + "-icon.svg?v=20261102", type: "image/svg+xml" },
        {
          url: "/product-assets/" + kind + "-32.png?v=20261102",
          sizes: "32x32",
          type: "image/png",
        },
      ],
      apple: "/product-assets/" + kind + "-180.png?v=20261102",
    },
    openGraph: {
      title: p.name + " — " + p.title,
      description: p.description,
      url: studioOrigin + path,
      siteName: p.name,
      images: [
        {
          url: "/product-assets/" + kind + "-og.png",
          width: 1200,
          height: 630,
          alt: p.description,
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: p.name + " — " + p.title,
      images: ["/product-assets/" + kind + "-og.png"],
    },
  };
}
