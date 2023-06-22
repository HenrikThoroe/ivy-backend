import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { Response } from 'express'

export type ContentType = 'data/octet-stream' | 'text/json'

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_ID!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT!,
  forcePathStyle: true,
  region: process.env.S3_REGION!,
})

export async function createBucket(bucket: string) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket.toLowerCase() }))
  } catch (e) {
    const cmd = new CreateBucketCommand({
      Bucket: bucket.toLowerCase(),
    })

    await client.send(cmd)
  }
}

export async function put(
  bucket: string,
  name: string,
  content: PutObjectCommandInput['Body'],
  type?: ContentType
) {
  await createBucket(bucket)

  const cmd = new PutObjectCommand({
    Bucket: bucket.toLowerCase(),
    Key: name,
    Body: content,
    ContentType: type,
  })

  await client.send(cmd)
}

export async function take(bucket: string, name: string) {
  const cmd = new GetObjectCommand({ Bucket: bucket.toLowerCase(), Key: name })
  const resp = await client.send(cmd)
  const bytes = await resp.Body?.transformToByteArray()

  if (bytes) {
    return Buffer.from(bytes)
  }

  throw new Error(`Could not create buffer from response data.`)
}

export async function pipe(bucket: string, name: string, response: Response) {
  const cmd = new GetObjectCommand({ Bucket: bucket.toLowerCase(), Key: name })
  const resp = await client.send(cmd)
  const stream = resp.Body

  if (!stream) {
    throw new Error(`Could not access engine data.`)
  }

  response.attachment(bucket)
  //@ts-ignore
  stream.pipe(response)
}

export async function listKeys(bucket: string) {
  const cmd = new ListObjectsCommand({ Bucket: bucket.toLowerCase() })
  const resp = await client.send(cmd)

  return (
    resp.Contents?.map((obj) => obj.Key).filter((key): key is string => key !== undefined) ?? []
  )
}

export async function listBuckets() {
  const cmd = new ListBucketsCommand({})
  const resp = await client.send(cmd)

  return (
    resp.Buckets?.map((obj) => obj.Name).filter((key): key is string => key !== undefined) ?? []
  )
}

export async function deleteKey(bucket: string, key: string) {
  const cmd = new DeleteObjectCommand({ Bucket: bucket.toLowerCase(), Key: key })
  await client.send(cmd)
}

export async function deleteBucket(bucket: string) {
  const keys = await listKeys(bucket)

  for (const key of keys) {
    await deleteKey(bucket, key)
  }

  const cmd = new DeleteBucketCommand({ Bucket: bucket.toLowerCase() })
  await client.send(cmd)
}
