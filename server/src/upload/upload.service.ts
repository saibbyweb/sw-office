import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_BUCKET_NAME;

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(
        'Missing required AWS environment variables: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME',
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.bucketName = bucketName;
    this.region = region;
  }

  private getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      webp: 'image/webp',
    };
    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  async getPresignedUrl(
    fileName: string,
    fileType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const EXPIRATION_IN_MINUTES = 20;
    const S3_UPLOAD_FOLDER = 'office'; // You can change this to any folder name

    try {
      const uuidString = uuidv4();
      const extension = fileName.split('.').pop() || '';
      const key = `${S3_UPLOAD_FOLDER}/${uuidString}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: this.getContentType(extension),
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: EXPIRATION_IN_MINUTES * 60,
      });

      const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      return {
        uploadUrl,
        fileUrl,
        key,
      };
    } catch (e) {
      console.error(e.message);
      throw new Error(e.message);
    }
  }

  async getPresignedUrlWithFolder(
    fileName: string,
    folder: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const EXPIRATION_IN_MINUTES = 20;

    try {
      const uuidString = uuidv4();
      const extension = fileName.split('.').pop() || '';
      const key = `${folder}/${uuidString}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: this.getContentType(extension),
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: EXPIRATION_IN_MINUTES * 60,
      });

      const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      return {
        uploadUrl,
        fileUrl,
        key,
      };
    } catch (e) {
      console.error(e.message);
      throw new Error(e.message);
    }
  }
}
