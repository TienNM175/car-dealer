import {
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.S3_BUCKET_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_BUCKET_ACCESS_KEY!,
    secretAccessKey: process.env.S3_BUCKET_SECRET_KEY!,
  },
});

interface UploadToS3Args {
  bucketName: string;
  path: string;
  file: Buffer;
  mimetype: string;
}

export async function uploadToS3({
  bucketName,
  file,
  path,
  mimetype,
}: UploadToS3Args) {
  const params = {
    Bucket: bucketName,
    Key: path,
    Body: file,
    ContentType: mimetype,
    CacheControl: "no-store",
  } satisfies PutObjectCommandInput;

  try {
    const command = new PutObjectCommand(params);
    return s3.send(command);
  } catch (error: unknown) {
    console.log(error);
    throw new Error(`Failed to upload file: ${path}. Error: ${error}`);
  }
}

export { s3 };
