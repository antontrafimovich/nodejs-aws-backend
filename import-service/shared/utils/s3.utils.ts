import {
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { ReadableOptions, Stream, TransformCallback } from "stream";

type S3ReadStreamParams = {
  s3client: S3Client;
  bucket: string;
  key: string;
};

const DEFAULT_CHUNKSIZE = 512 * 1024;

class S3ReadStream extends Stream.Transform {
  private params: S3ReadStreamParams;
  private currentCursorPosition = 0;
  private maxContentLength = -1;

  constructor(params: S3ReadStreamParams) {
    super();
    params = params;
  }

  async init() {
    let res: HeadObjectCommandOutput;

    const headObjectCommand = new HeadObjectCommand({
      Bucket: this.params.bucket,
      Key: this.params.key,
    });

    try {
      res = await this.params.s3client.send(headObjectCommand);
    } catch (err) {
      throw err;
    }

    this.maxContentLength = res.ContentLength ?? this.maxContentLength;
    await this.fetchAndEmitNextRange();
  }

  private async fetchAndEmitNextRange() {
    if (this.currentCursorPosition > this.maxContentLength) {
      this.end();
      return;
    }

    const range = this.currentCursorPosition + DEFAULT_CHUNKSIZE;

    const adjustedRange =
      range < this.maxContentLength ? range : this.maxContentLength;

    const rangeParam = `bytes=${this.currentCursorPosition}-${adjustedRange}`;

    this.currentCursorPosition = adjustedRange + 1;

    let res: GetObjectCommandOutput;

    const getObjectCommand = new GetObjectCommand({
      Bucket: this.params.bucket,
      Key: this.params.key,
      Range: rangeParam,
      ResponseContentEncoding: "utf-8",
    });

    try {
      res = await this.params.s3client.send(getObjectCommand);
    } catch (err) {
      this.destroy(err as Error);
      throw err;
    }

    console.log(
      `fetched range ${this.params.bucket}/${this.params.key} | ${rangeParam}`
    );

    const data = res.Body;

    if (!(data instanceof Stream.Readable)) {
      this.destroy(new Error(`unsupported data representation: ${data}`));
      return;
    }

    data.pipe(this, { end: false });

    let streamClosed = false;

    data.on("end", async () => {
      if (streamClosed) {
        return;
      }
      streamClosed = true;
      await this.fetchAndEmitNextRange();
    });
  }

  transform(chunk: any, _: BufferEncoding, callback: TransformCallback) {
    callback(null, chunk);
  }
}

export const createS3ReadStream = (
  client: S3Client,
  bucket: string,
  key: string
) => {
  const stream = new S3ReadStream({ s3client: client, bucket, key });
  stream.init();

  return stream;
};
