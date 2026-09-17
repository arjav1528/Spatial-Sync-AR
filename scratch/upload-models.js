const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const REGION = (process.env.AWS_REGION || 'eu-central-1').trim();
const S3_BUCKET = (process.env.S3_BUCKET_NAME || 'spatial-sync-arjav').trim();

const credentials = process.env.AWS_ACCESS_KEY_ID
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
      sessionToken: process.env.AWS_SESSION_TOKEN ? process.env.AWS_SESSION_TOKEN.trim() : undefined,
    }
  : undefined;

const s3Client = new S3Client({ region: REGION, credentials });

const modelsDir = '/Users/arjav.patel/Downloads/Models';
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.glb') || f.endsWith('.usdz'));

async function uploadAll() {
  console.log(`Uploading ${files.length} models to S3 bucket ${S3_BUCKET} (${REGION})...`);

  for (const file of files) {
    const filePath = path.join(modelsDir, file);
    const key = `assets/${file}`;
    const fileStream = fs.readFileSync(filePath);

    console.log(`Uploading ${file} (${(fileStream.length / (1024 * 1024)).toFixed(2)} MB) to s3://${S3_BUCKET}/${key}...`);

    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: file.endsWith('.glb') ? 'model/gltf-binary' : 'model/vnd.usdz+zip',
    }));

    console.log(`✓ Uploaded ${file} successfully!`);
  }

  console.log('All models uploaded to S3!');
}

uploadAll().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
