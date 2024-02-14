"use client";

import { useEffect } from "react";

export default function Home() {
  // open 20 tabs instantaneously to see whether the server will handle all streams.
  // You will need to 'allow all popups' in your browser to see this in effect.
  useEffect(() => {
    let tabs = 20;
    while (tabs) {
      window.open("/logs", "_blank");
      tabs--;
    }
  }, []);
}