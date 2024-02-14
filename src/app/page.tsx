"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const anchorForScrollId = "anchor-to-tell-document-to-scroll-to";
export default function Home() {
  const [streamingLogs, setStreamingLogs] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const timeoutHandle = useRef<NodeJS.Timeout>();
  const isFetchOngoing = useRef(false);

  const getLogs = useCallback(async () => {
    if (isFetchOngoing.current) {
      return;
    }
    isFetchOngoing.current = true;
    setStreamingLogs("");
    try {
      const response = await fetch(`/api/logging`);
      if (response.ok) {
        const textDecoder = new TextDecoder();
        const reader = response?.body?.getReader();

        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (value) {
              const stringData = textDecoder.decode(value);
              setStreamingLogs((l) => `${l}${stringData}`);
            }
            // if done, call getLogs again at some point in future for more data.
            if (done) {
              // reset the logs to an empty string so that for the next fetch, we don't duplicate strings.
              clearTimeout(timeoutHandle.current);
              timeoutHandle.current = setTimeout(getLogs, 100000);
              isFetchOngoing.current = false;
              return;
            }
          }
        } else {
          const json = await response.json();
          setErrorMessage(
            `An error occurred:${json?.message}. You'll need to refresh this page.`,
          );
        }
      }
    } catch (e) {
      setErrorMessage(
        `An error occurred: ${(e as any)?.message} ${(e as any)?.response?.message}. You'll need to refresh this page.`,
      );
    }
  }, []);

  useEffect(() => {
    getLogs().then();

    const _handle = timeoutHandle.current;
    return () => {
      clearTimeout(_handle);
    };
  }, [getLogs]);

  useEffect(() => {
    document.getElementById(anchorForScrollId)?.scrollIntoView({
      behavior: "smooth",
    });
  }, [streamingLogs]);

  const logs = useMemo(() => {
    return streamingLogs?.split("\n");
  }, [streamingLogs]);

  return (
    <div className="flex flex-col w-full h-[100vh] p-10 overflow-auto">
      <h5 className="w-full pb-4 border-b border-secondary-color-100 border-solid">
        Logs should automatically start appearing below.
      </h5>
      <h5 className="text-red-700">{errorMessage}</h5>
      {logs?.map((l, idx) => (
        <h6 key={idx} className="w-full">
          {l || <br />}
        </h6>
      ))}
      <div id={anchorForScrollId} />
    </div>
  );
}