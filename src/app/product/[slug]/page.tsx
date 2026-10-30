import { redirect } from "next/navigation";

export default function ProductRedirectPage({ params }: { params: { slug: string } }) {
  redirect(`/products/${params.slug}`);
}
