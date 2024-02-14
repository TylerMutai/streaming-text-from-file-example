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

function getFileReaderConfig(dateFromRequest = new Date()) {
  let date = new Date();
  try {
    const dateVal = new Date(dateFromRequest);
    if (dateVal.getFullYear() >= 2024) {
      date = new Date(dateFromRequest);
    }
  } catch (e) {
    // ignore date formatting
  }
  // since toISOString converts date to UTC zero, we'll add 3 hours as we know we're on UTC+3 timezone.
  // feel free to edit this to match your own timezone.
  date.setHours(date.getHours() + 3);
  const filePath = path.join(
    process.cwd(),
    `logs/${process.env.X_SOURCE_SYSTEM}-${date.toISOString().split("T")[0]}.log`,
  );
  const fileStats = fs.statSync(filePath);
  const byteLengthToRead = 1600; // represents 1.6KB. There's no reason for this, I just chose the number at random.

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
  await sleep(1000);

  yield await readFile(filePath, start, end);

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

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    const { searchParams } = req.nextUrl;
    const { filePath, start, end, byteLengthToRead, fileSize } =
      getFileReaderConfig(
        searchParams.get("date")
          ? new Date(searchParams.get("date") as any)
          : undefined,
      );

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
        header: {
          responseMessage: (e as any)?.message,
          responseCode: 500,
          customerMessage:
            (e as any)?.message || "A server error occurred. Contact support.",
        },
      },
      {
        status: 500,
      },
    );
  }
}