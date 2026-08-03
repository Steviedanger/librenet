import multer from 'multer';

// Keep uploads in memory so the storage layer can stream them to Cloudinary
// (or write them to local disk in dev). Nothing touches disk here.
const storage = multer.memoryStorage();

// Validate by field: covers/avatars must be images, the book file must be PDF.
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'coverImage' || file.fieldname === 'avatar') {
    if (/image\/(jpeg|jpg|png|webp)/.test(file.mimetype)) return cb(null, true);
    return cb(new Error('Image must be a JPG, PNG or WEBP'));
  }
  if (file.fieldname === 'pdfFile') {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    return cb(new Error('Book file must be a PDF'));
  }
  cb(new Error('Unexpected file field'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Accept a single cover image and a single PDF in one request
export const uploadBookFiles = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 },
]);

export const uploadAvatar = upload.single('avatar');

export default upload;
