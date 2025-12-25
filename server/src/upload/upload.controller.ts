import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @Post('profile-picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuidv4();
          callback(
            null,
            `profile-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadProfilePicture(@UploadedFile() file: Express.Multer.File) {
    // Return the full URL path that will be stored in the database
    const fileUrl = `/uploads/${file.filename}`;
    return { url: fileUrl };
  }

  @Post('receipt')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuidv4();
          callback(
            null,
            `receipt-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      fileFilter: (req, file, callback) => {
        // Allow images and PDFs
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/i)) {
          return callback(new Error('Only image and PDF files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadReceipt(@UploadedFile() file: Express.Multer.File) {
    const fileUrl = `/uploads/${file.filename}`;
    return { url: fileUrl };
  }

  @Get('presigned-url')
  async getPresignedUrl(
    @Query('fileName') fileName: string,
    @Query('fileType') fileType: string,
  ) {
    if (!fileName || !fileType) {
      throw new Error('fileName and fileType are required query parameters');
    }

    const result = await this.uploadService.getPresignedUrl(
      fileName,
      fileType,
    );
    return {
      uploadUrl: result.uploadUrl,
      fileUrl: result.fileUrl,
      key: result.key,
    };
  }

  @Get('sw-creator-store')
  async getSwCreatorStorePresignedUrl(
    @Query('fileName') fileName: string,
  ) {
    const SW_CREATOR_STORE_FOLDER = 'sw-creator-store'; // You can modify this subfolder path

    if (!fileName) {
      throw new Error('fileName is a required query parameter');
    }

    const result = await this.uploadService.getPresignedUrlWithFolder(
      fileName,
      SW_CREATOR_STORE_FOLDER,
    );
    return {
      uploadUrl: result.uploadUrl,
      fileUrl: result.fileUrl,
      key: result.key,
    };
  }
}
