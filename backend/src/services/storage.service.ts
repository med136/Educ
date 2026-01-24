import fs from 'fs'
import path from 'path'
import { S3 } from 'aws-sdk'

export interface StoredFile {
  url: string
  key: string
  provider: 'local' | 's3' | 'minio'
}

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'
const BUCKET_NAME = process.env.AWS_BUCKET_NAME
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || process.env.MINIO_ENDPOINT

const s3 = (() => {
  if (STORAGE_TYPE !== 's3' && STORAGE_TYPE !== 'minio') return null
  if (!BUCKET_NAME) {
    throw new Error('AWS_BUCKET_NAME doit être défini pour le stockage s3/minio')
  }

  const config: S3.ClientConfiguration = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
  }

  if (STORAGE_ENDPOINT) {
    config.endpoint = STORAGE_ENDPOINT
    config.s3ForcePathStyle = true
  }

  return new S3(config)
})()

export async function storeDocumentFile(file: Express.Multer.File): Promise<StoredFile> {
  return storeUploadedFile(file, 'documents')
}

export async function storeUploadedFile(
  file: Express.Multer.File,
  prefix: string
): Promise<StoredFile> {
  const provider = (STORAGE_TYPE === 's3' || STORAGE_TYPE === 'minio' ? STORAGE_TYPE : 'local') as
    | 'local'
    | 's3'
    | 'minio'

  if (provider === 's3' || provider === 'minio') {
    if (!s3 || !BUCKET_NAME) {
      throw new Error('Client S3 non initialisé')
    }

    const key = `${prefix}/${Date.now()}-${path.basename(file.filename)}`

    const fileStream = fs.createReadStream(file.path)

    await s3
      .upload({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
      })
      .promise()

    // Conserver l'URL construite à partir de l'endpoint + bucket + clé
    let baseUrl: string
    if (STORAGE_ENDPOINT) {
      const endpoint = STORAGE_ENDPOINT.replace(/\/$/, '')
      baseUrl = `${endpoint}/${BUCKET_NAME}`
    } else {
      baseUrl = `https://${BUCKET_NAME}.s3.amazonaws.com`
    }

    const url = `${baseUrl}/${key}`

    try {
      fs.unlinkSync(file.path)
    } catch {
      // Ignorer en cas d'échec de suppression locale
    }

    return { url, key, provider }
  }

  // Mode local: on expose le chemin public existant
  return { url: `/uploads/${file.filename}`, key: file.filename, provider: 'local' }
}

export async function deleteStoredFile(input: {
  key: string
  provider: 'local' | 's3' | 'minio'
}): Promise<void> {
  if (input.provider === 's3' || input.provider === 'minio') {
    if (!s3 || !BUCKET_NAME) {
      throw new Error('Client S3 non initialisé')
    }
    await s3
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: input.key,
      })
      .promise()
    return
  }

  const uploadsDir = path.join(__dirname, '../../uploads')
  const filePath = path.join(uploadsDir, path.basename(input.key))
  try {
    fs.unlinkSync(filePath)
  } catch {
    // Ignore si le fichier n'existe pas ou suppression impossible
  }
}
