import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Something went wrong: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  },
});

apiRoute.use(upload.single('file'));

apiRoute.post(async (req, res) => {
  try {
    const result = await cloudinary.v2.uploader.upload_stream((error, result) => {
      if (error) {
        return res.status(500).json({ error: 'Upload failed.' });
      }
      res.status(200).json({ url: result.secure_url });
    }).end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: 'Error uploading file.' });
  }
});

export default apiRoute;

export const config = {
  api: {
    bodyParser: false,
  },
};
