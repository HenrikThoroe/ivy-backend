import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { Response } from 'express'

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
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
  } catch (e) {
    const cmd = new CreateBucketCommand({
      Bucket: bucket,
    })

    await client.send(cmd)
  }
}

export async function put(bucket: string, name: string, content: PutObjectCommandInput['Body']) {
  await createBucket(bucket)

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: name,
    Body: content,
  })

  await client.send(cmd)
}

export async function take(bucket: string, name: string) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: name })
  const resp = await client.send(cmd)
  const bytes = await resp.Body?.transformToByteArray()

  if (bytes) {
    return Buffer.from(bytes)
  }

  throw new Error(`Could not create buffer from response data.`)
}

export async function pipe(bucket: string, name: string, response: Response) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: name })
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
  const cmd = new ListObjectsCommand({ Bucket: bucket })
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
