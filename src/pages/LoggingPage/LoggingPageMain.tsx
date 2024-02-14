"use client";

import { useSearchParams } from "next/dist/client/components/navigation";
import { FC, useEffect, useMemo, useRef, useState } from "react";

export interface LoggingPageMainProps {}
const LoggingPageMain: FC<LoggingPageMainProps> = () => {
  const [streamingLogs, setStreamingLogs] = useState<string>("");
  const timeoutHandle = useRef<NodeJS.Timeout>();
  const params = useSearchParams();
  const stringLogs = useRef<string>("");

  useEffect(() => {
    const _getLogs = async () => {
      try {
        const response = await fetch(
          `/api/logging?date=${params.get("date") || ""}`,
        );
        if (response.ok) {
          const textDecoder = new TextDecoder();
          const reader = response?.body?.getReader();

          if (reader) {
            while (true) {
              // eslint-disable-next-line no-await-in-loop
              const { value, done } = await reader.read();
              if (value) {
                const stringData = textDecoder.decode(value);
                stringLogs.current = `${stringLogs.current}${stringData}`;
                setStreamingLogs(stringLogs.current);
              }
              // if done, call _getLogs again at some point in future for more data.
              if (done) {
                // reset the logs to an empty string so that for the next fetch, we don't duplicate strings.
                stringLogs.current = "";
                clearTimeout(timeoutHandle.current);
                timeoutHandle.current = setTimeout(_getLogs, 10000);
                return;
              }
            }
          } else {
            const json = await response.json();
            alert(
              `An error occurred: ${json?.header?.responseMessage}. You'll need to refresh this page.`,
            );
          }
        }
      } catch (e) {
        alert(
          `An error occurred: ${(e as any)?.message}. You'll need to refresh this page.`,
        );
      }
    };
    _getLogs().then();

    const _handle = timeoutHandle.current;
    return () => {
      clearTimeout(_handle);
    };
  }, [params]);

  const logs = useMemo(() => {
    return streamingLogs?.split("\n");
  }, [streamingLogs]);

  return (
    <div className="flex flex-col w-full h-[100vh] p-10 overflow-auto">
      <h5 className="w-full pb-4 border-b border-secondary-color-100 border-solid">
        Logs should automatically start appearing below.
      </h5>
      {logs?.map((l, idx) => (
        <h6 key={idx} className="w-full">
          {l || <br />}
        </h6>
      ))}
    </div>
  );
};

export default LoggingPageMain;