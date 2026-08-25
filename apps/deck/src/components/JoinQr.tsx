/**
 * The workshop URL as a QR code, baked at author time.
 *
 * Generated once from `https://workshop-dto-web.onrender.com/` with the
 * `qrcode` package at error-correction level M, then emitted as a single SVG
 * path. It is baked rather than generated at runtime for the reason everything
 * else in this deck is: the file has to work from a USB stick with no network
 * and no dependency it did not bring itself. If the URL ever changes, this file
 * has to be regenerated — it cannot follow along.
 *
 * The code is 29 modules square with a one-module quiet zone added by the
 * viewBox, and it is never the only way in: the URL is always spelled out next
 * to it, because a QR nobody can scan from the back of the room is decoration.
 */
export const JOIN_URL = "https://workshop-dto-web.onrender.com/";

export function JoinQr({ size = 300 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-1 -1 31 31"
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
    >
      <rect x="-1" y="-1" width="31" height="31" fill="var(--color-neutral-white)" />
      <path d="M0 0h7v1h-7zM8 0h1v1h-1zM10 0h1v1h-1zM12 0h2v1h-2zM16 0h1v1h-1zM18 0h3v1h-3zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM11 1h1v1h-1zM16 1h3v1h-3zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM9 2h1v1h-1zM11 2h5v1h-5zM18 2h1v1h-1zM20 2h1v1h-1zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h2v1h-2zM12 3h2v1h-2zM17 3h1v1h-1zM20 3h1v1h-1zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM9 4h1v1h-1zM11 4h1v1h-1zM13 4h5v1h-5zM19 4h1v1h-1zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM11 5h1v1h-1zM14 5h1v1h-1zM17 5h1v1h-1zM19 5h2v1h-2zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM8 7h3v1h-3zM12 7h1v1h-1zM15 7h1v1h-1zM17 7h1v1h-1zM0 8h1v1h-1zM2 8h2v1h-2zM5 8h3v1h-3zM9 8h1v1h-1zM11 8h1v1h-1zM13 8h1v1h-1zM16 8h2v1h-2zM22 8h1v1h-1zM25 8h1v1h-1zM27 8h2v1h-2zM1 9h1v1h-1zM5 9h1v1h-1zM7 9h1v1h-1zM9 9h1v1h-1zM11 9h1v1h-1zM13 9h1v1h-1zM16 9h4v1h-4zM22 9h3v1h-3zM28 9h1v1h-1zM2 10h3v1h-3zM6 10h4v1h-4zM12 10h2v1h-2zM18 10h1v1h-1zM24 10h1v1h-1zM26 10h2v1h-2zM0 11h1v1h-1zM4 11h2v1h-2zM8 11h1v1h-1zM10 11h1v1h-1zM15 11h1v1h-1zM20 11h2v1h-2zM24 11h1v1h-1zM28 11h1v1h-1zM6 12h2v1h-2zM9 12h3v1h-3zM14 12h1v1h-1zM17 12h1v1h-1zM19 12h1v1h-1zM25 12h2v1h-2zM4 13h1v1h-1zM7 13h1v1h-1zM9 13h3v1h-3zM14 13h2v1h-2zM19 13h1v1h-1zM22 13h1v1h-1zM26 13h3v1h-3zM4 14h4v1h-4zM10 14h1v1h-1zM12 14h2v1h-2zM16 14h4v1h-4zM24 14h1v1h-1zM26 14h3v1h-3zM1 15h1v1h-1zM3 15h1v1h-1zM7 15h6v1h-6zM14 15h1v1h-1zM20 15h2v1h-2zM24 15h1v1h-1zM27 15h1v1h-1zM6 16h2v1h-2zM12 16h1v1h-1zM14 16h1v1h-1zM16 16h1v1h-1zM18 16h1v1h-1zM21 16h1v1h-1zM24 16h2v1h-2zM27 16h1v1h-1zM1 17h5v1h-5zM8 17h2v1h-2zM11 17h2v1h-2zM14 17h2v1h-2zM17 17h1v1h-1zM20 17h1v1h-1zM23 17h1v1h-1zM25 17h3v1h-3zM0 18h1v1h-1zM2 18h5v1h-5zM10 18h1v1h-1zM12 18h6v1h-6zM22 18h2v1h-2zM26 18h1v1h-1zM2 19h1v1h-1zM4 19h2v1h-2zM8 19h1v1h-1zM12 19h3v1h-3zM16 19h2v1h-2zM21 19h2v1h-2zM24 19h1v1h-1zM26 19h1v1h-1zM1 20h2v1h-2zM4 20h4v1h-4zM11 20h4v1h-4zM16 20h11v1h-11zM8 21h3v1h-3zM16 21h1v1h-1zM20 21h1v1h-1zM24 21h5v1h-5zM0 22h7v1h-7zM8 22h2v1h-2zM11 22h2v1h-2zM14 22h1v1h-1zM19 22h2v1h-2zM22 22h1v1h-1zM24 22h2v1h-2zM27 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h1v1h-1zM10 23h2v1h-2zM13 23h2v1h-2zM20 23h1v1h-1zM24 23h2v1h-2zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM9 24h1v1h-1zM11 24h1v1h-1zM15 24h1v1h-1zM17 24h1v1h-1zM20 24h5v1h-5zM26 24h1v1h-1zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM8 25h1v1h-1zM10 25h3v1h-3zM15 25h3v1h-3zM19 25h3v1h-3zM23 25h3v1h-3zM28 25h1v1h-1zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM8 26h1v1h-1zM12 26h1v1h-1zM14 26h1v1h-1zM16 26h1v1h-1zM18 26h1v1h-1zM20 26h2v1h-2zM23 26h1v1h-1zM26 26h1v1h-1zM28 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM9 27h1v1h-1zM11 27h4v1h-4zM16 27h1v1h-1zM20 27h2v1h-2zM23 27h1v1h-1zM25 27h1v1h-1zM27 27h1v1h-1zM0 28h7v1h-7zM8 28h1v1h-1zM10 28h2v1h-2zM14 28h2v1h-2zM18 28h1v1h-1zM20 28h1v1h-1zM25 28h1v1h-1zM27 28h1v1h-1z" fill="var(--color-text-primary)" />
    </svg>
  );
}
