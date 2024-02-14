"use client";

import React from "react";

function Index({ error }: Readonly<{ error: Error & { digest?: string } }>) {
  return (
    <div className="flex flex-col w-full h-[100vh] items-center justify-center gap-10 px-10 py-10">
      <h4 className="text-red-700 text-center">
        An error occurred. Hang on tight as our engineers work on it. (
        {error?.message ? error?.message : "No additional details reported."})
      </h4>
    </div>
  );
}

export default Index;