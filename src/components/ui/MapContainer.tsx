"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapContainer(props: {
  lat?: number;
  lng?: number;
  label?: string;
  zoom?: number;
  height?: string;
  className?: string;
}) {
  return <MapView {...props} />;
}
