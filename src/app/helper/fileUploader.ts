import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import path from "path";
import config from "../../config";

const isProduction = process.env.NODE_ENV === "production";

// ---------------- Storage Setup ----------------
let storage;

if (isProduction) {
  // Vercel -> memory storage
  storage = multer.memoryStorage();
} else {
  // Local development -> disk storage
  storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.join(process.cwd(), "uploads"));
    },
    filename(req, file, cb) {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + unique);
    },
  });
}

const upload = multer({ storage });

// ---------------- Cloudinary Upload ----------------
const uploadToCloudinary = async (
  file: Express.Multer.File
): Promise<{ secure_url: string }> => {
  cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
  });

  // Local dev -> has file.path
  if (file.path) {
    return await cloudinary.uploader.upload(file.path, {
      public_id: file.filename,
    });
  }

  // Production (Vercel) -> file.buffer only
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "uploads" },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result);
        else reject(new Error("Upload result is undefined"));
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const fileUploader = {
  upload,
  uploadToCloudinary,
};
