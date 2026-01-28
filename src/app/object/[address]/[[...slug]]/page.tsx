"use client";

import AccountDetailPage from "@/app/account/[address]/[[...slug]]/page";

/**
 * Object detail page - reuses AccountDetailPage component
 * This route handles /object/[address] and /object/[address]/[[...slug]] paths
 *
 * The AccountDetailPage component will detect that it's on the /object route
 * via the pathname and display object-specific information.
 */
export default function ObjectDetailPage() {
  return <AccountDetailPage />;
}
