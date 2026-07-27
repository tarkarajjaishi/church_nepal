import NepaliDateConverter from "nepali-date-converter";

// nepali-date-converter ships as a default export; normalise for CJS/ESM interop.
const NepaliDate: typeof NepaliDateConverter =
  (NepaliDateConverter as unknown as { default?: typeof NepaliDateConverter }).default ??
  NepaliDateConverter;

/**
 * Convert an AD/ISO date to a Bikram Sambat (BS) display string.
 * @param iso  ISO date string (e.g. "2026-07-19T10:00:00")
 * @param lang "en" -> "3 Shrawan 2083 BS", "ne" -> "२०८३ श्रावण ३"
 */
export function toBS(iso: string, lang: "en" | "ne"): string {
  try {
    const nd = new NepaliDate(new Date(iso));
    if (lang === "ne") return nd.format("YYYY MMMM D", "np");
    const { year } = nd.getBS();
    return `${nd.format("D MMMM", "en")} ${year} BS`;
  } catch {
    return "";
  }
}
