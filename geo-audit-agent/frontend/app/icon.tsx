import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
    width: 32,
    height: 32,
};
export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #020617 0%, #0b1120 45%, #111827 100%)",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 2,
                        borderRadius: 10,
                        border: "1px solid rgba(148,163,184,0.35)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        border: "3px solid #67e8f9",
                        boxSizing: "border-box",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: 10,
                        height: 3,
                        background: "#2dd4bf",
                        borderRadius: 999,
                        transform: "translate(7px, 7px) rotate(-55deg)",
                        transformOrigin: "left center",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: 4,
                        height: 4,
                        borderRadius: 999,
                        background: "#67e8f9",
                        transform: "translate(8px, -8px)",
                    }}
                />
            </div>
        ),
        {
            ...size,
        },
    );
}