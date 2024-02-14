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

  return (
    <h2 className="p-10 m-10 w-full flex flex-row- items-center justify-center">
      Nothing&apos;s happening? Make sure to enable popups in your browser!
    </h2>
  );
}