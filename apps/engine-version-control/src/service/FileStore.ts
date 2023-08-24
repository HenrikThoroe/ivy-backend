import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { loadenv } from 'env-util'
import { z } from 'zod'

loadenv()

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_ID!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT!,
  forcePathStyle: true,
  region: process.env.S3_REGION!,
})

type Type<T> = z.ZodType<T> | 'buffer'

type Value<T extends Type<any>> = T extends z.ZodType<infer U> ? U : Buffer

/**
 * A file store backed by S3.
 * Exposes a simple API for reading and writing files in a bucket.
 */
export class FileStore {
  private readonly bucket: string

  constructor(bucket: string) {
    this.bucket = bucket.toLowerCase()
  }

  //* API

  /**
   * Lists all buckets in the S3 account.
   * Returned bucket names can be used to initialize a new FileStore.
   *
   * @returns A list of all buckets in the S3 account.
   */
  public static async all(): Promise<string[]> {
    const cmd = new ListBucketsCommand({})
    const resp = await client.send(cmd)

    return (
      resp.Buckets?.map((obj) => obj.Name).filter((key): key is string => key !== undefined) ?? []
    )
  }

  /**
   * Deletes the bucket and all files in it.
   */
  public async delete(): Promise<void> {
    for (const key of await this.keys()) {
      await this.remove(key)
    }

    const cmd = new DeleteBucketCommand({ Bucket: this.bucket })
    await client.send(cmd)
  }

  /**
   * Lists all files in the bucket.
   *
   * @returns A list of all files in the bucket.
   */
  public async keys(): Promise<string[]> {
    const cmd = new ListObjectsCommand({ Bucket: this.bucket })
    const resp = await client.send(cmd)

    return (
      resp.Contents?.map((obj) => obj.Key).filter((key): key is string => key !== undefined) ?? []
    )
  }

  /**
   * Reads a file from the bucket.
   * The file is parsed using the given type.
   *
   * @param key The key of the file to read.
   * @param type The type to parse the file with.
   * @returns The parsed file.
   * @throws If the file does not exist or could not be parsed.
   */
  public async read<T extends Type<any>>(key: string, type: T): Promise<Value<T>> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key })
    const resp = await client.send(cmd)
    const bytes = await resp.Body?.transformToByteArray()

    if (!bytes) {
      throw new Error(`Could not create buffer from response data.`)
    }

    const buffer = Buffer.from(bytes)

    if (type === 'buffer') {
      return buffer as Value<T>
    }

    const json = JSON.parse(buffer.toString())
    const value = type.parse(json)

    return value
  }

  /**
   * Writes a file to the bucket.
   * The file is serialized using the given type.
   * If the file already exists it will be overwritten.
   * If the bucket does not exist it will be created.
   *
   * @param key The key of the file to write.
   * @param type The type to serialize the file with.
   * @param value The value to serialize.
   */
  public async write<T extends Type<any>>(key: string, type: T, value: Value<T>): Promise<void> {
    const data = this.serialize(type, value)
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: 'data/octet-stream',
    })

    await this.createBucket()
    await client.send(cmd)
  }

  /**
   * Removes a file from the bucket.
   *
   * @param key The key of the file to remove.
   */
  public async remove(key: string): Promise<void> {
    const cmd = new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    await client.send(cmd)
  }

  /**
   * Checks if a file exists in the bucket.
   *
   * @param key The key of the file to check.
   * @returns Whether or not the file exists.
   */
  public async has(key: string): Promise<boolean> {
    try {
      const cmd = new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      await client.send(cmd)
      return true
    } catch {
      return false
    }
  }

  //* Private Methods

  private serialize<T extends Type<any>>(type: T, value: Value<T>): Buffer {
    if (type === 'buffer') {
      return value
    }

    const json = type.parse(value)
    const txt = JSON.stringify(json)

    return Buffer.from(txt)
  }

  private async createBucket() {
    try {
      await client.send(new HeadBucketCommand({ Bucket: this.bucket }))
    } catch (e) {
      const cmd = new CreateBucketCommand({
        Bucket: this.bucket,
      })

      await client.send(cmd)
    }
  }
}
