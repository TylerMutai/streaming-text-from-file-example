import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

/**
 *
 * @param duration - milliseconds to wait before resolving the promise.
 */
function sleep(duration = 2000) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

async function readFile(filePath: string, start: number, end: number) {
  const readStream = fs.createReadStream(filePath, {
    start,
    end,
  });

  return new Promise<Buffer>((resolve) => {
    readStream.on("data", (data) => {
      resolve(data as any);
    });
  });
}

function getFileReaderConfig() {
  // File being read. the file contains at least 6 thousand lines of logs.
  // They'll all be efficiently streamed to the frontend without overusing your server's memory.
  // Open multiple tabs using the same URL and see for yourself.
  const filePath = path.join(process.cwd(), `logs/2024-02-13.log`);
  const fileStats = fs.statSync(filePath);
  const byteLengthToRead = 16000; // represents 16KB. There's no reason for this, I just chose the number since it showcases streaming better.

  const start = 0;
  let end = start + byteLengthToRead;

  if (end > fileStats.size) {
    end = fileStats.size;
  }

  return { filePath, start, end, byteLengthToRead, fileSize: fileStats.size };
}

async function* makeIterator(
  filePath: string,
  start: number,
  end: number,
  byteLengthToRead: number,
  fileSize: number,
): any {
  if (start >= end) {
    // we have read the whole file. save last read bytes and return.
    return;
  }
  // This is just added here to better showcase streaming on the browser. You'll be able to see data being populated.
  // Feel free to remove this line to use streaming at its best.
  await sleep(10);

  // The reason there's a start + 1 here is because we end up re-reading an extra byte everytime, duplicating
  // the last character read twice.
  yield await readFile(filePath, start + 1, end);

  // move [byteLengthToRead] bytes behind.
  const _start = end;
  let _end = end + byteLengthToRead;

  // if moving [byteLengthToRead] bytes behind becomes less than [ceiling], then move our
  // [_start] to [ceiling].
  if (_end > fileSize) {
    _end = fileSize;
  }
  yield* makeIterator(filePath, _start, _end, byteLengthToRead, fileSize);
}

function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

export async function GET() {
  try {
    const { filePath, start, end, byteLengthToRead, fileSize } =
      getFileReaderConfig();

    const iterator = makeIterator(
      filePath,
      start,
      end,
      byteLengthToRead,
      fileSize,
    );
    const stream = iteratorToStream(iterator);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        message: `A server error occurred. Contact support. ${(e as any)?.message}`,
        code: 500,
      },
      {
        status: 500,
      },
    );
  }
}