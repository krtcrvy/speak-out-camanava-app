import * as Location from 'expo-location';

export type ExtendedGeocodedAddress = Location.LocationGeocodedAddress & {
  subregion?: string | null; // optional, without breaking the base type
};

export function formatAddress(p: ExtendedGeocodedAddress) {
  const city = p.city ?? p.subregion ?? "CAMANAVA";
  const street = p.street || "Unknown Street";

  const formatted = [
    `${p.name || ""} ${street}`.trim(),
    city,
    "Metro Manila",
  ]
    .filter(Boolean)
    .join(", ");

  return { formatted, city, street };
}
