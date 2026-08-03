import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * File storage abstraction.
 *
 * When Cloudinary credentials are present we upload to Cloudinary (durable,
 * works on ephemeral hosts like Render/Vercel free tiers). Otherwise we fall
 * back to the local `uploads/` folder so local development needs no extra
 * config. Each saved file returns a public-facing `url` plus a `publicId`
 * used later for deletion; local files use a `local:` prefix on the publicId.
 */

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Map an upload "kind" to a folder name in each backend.
const FOLDERS = {
  cover: 'covers',
  pdf: 'pdfs',
  avatar: 'avatars',
};

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      // resource_type 'auto' stores PDFs as deliverable image assets and
      // images as images, so a single destroy({resource_type:'image'}) works.
      { folder: `librenet/${folder}`, resource_type: 'auto' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

const saveLocally = async (file, folder) => {
  const dir = path.join(__dirname, '..', 'uploads', folder);
  await fs.promises.mkdir(dir, { recursive: true });

  const ext = path.extname(file.originalname).toLowerCase();
  const base = path
    .basename(file.originalname, ext)
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .slice(0, 40);
  const filename = `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const abs = path.join(dir, filename);

  await fs.promises.writeFile(abs, file.buffer);
  const relUrl = `/uploads/${folder}/${filename}`;
  return { url: relUrl, publicId: `local:${relUrl}` };
};

/**
 * Persist an in-memory Multer file.
 * @param {{ buffer: Buffer, originalname: string }} file
 * @param {'cover'|'pdf'|'avatar'} kind
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const saveUpload = async (file, kind) => {
  const folder = FOLDERS[kind] || 'misc';
  if (isCloudinaryConfigured) {
    const result = await uploadToCloudinary(file.buffer, folder);
    return { url: result.secure_url, publicId: result.public_id };
  }
  return saveLocally(file, folder);
};

/**
 * Remove a previously saved file. Safe to call with empty/undefined ids.
 */
export const removeUpload = async (publicId) => {
  if (!publicId) return;
  try {
    if (publicId.startsWith('local:')) {
      const rel = publicId.slice('local:'.length).replace(/^\/+/, '');
      await fs.promises.unlink(path.join(__dirname, '..', rel));
    } else {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    }
  } catch {
    // Best-effort cleanup — a missing file should never block the request.
  }
};
