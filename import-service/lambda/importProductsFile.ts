import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const createSignedS3Url = (
  region: string,
  bucket: string,
  key: string
): Promise<string> => {
  const client = new S3Client({ region });
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

const createNoEnvVarProvidedResponse = (varName: string) => {
  return {
    statusCode: 500,
    headers: { "Content-Type": "text/plain" },
    body: `${varName} env var hasn't been provided`,
  };
};

const createServerErrorResponse = (err: Error) => {
  return {
    statusCode: 500,
    headers: { "Content-Type": "text/plain" },
    body: `Internal server error: ${err.message}`,
  };
};

export const handler = async (event: any) => {
  const { name } = event.queryStringParameters;

  if (name === undefined) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: `Filename hasn't been provided`,
    };
  }

  let signedUrl: string;

  if (process.env.REGION === undefined) {
    return createNoEnvVarProvidedResponse("region");
  }

  if (process.env.BUCKET_NAME === undefined) {
    return createNoEnvVarProvidedResponse("bucket");
  }

  try {
    signedUrl = await createSignedS3Url(
      process.env.REGION,
      process.env.BUCKET_NAME,
      `uploaded/${name}`
    );
  } catch (err: unknown) {
    return createServerErrorResponse(err as Error);
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: signedUrl,
  };
};
