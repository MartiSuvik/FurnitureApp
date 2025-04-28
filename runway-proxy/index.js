const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { fal } = require("@fal-ai/client");
const cloudinary = require('cloudinary').v2;
const stream = require('stream');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

fal.config({
  credentials: process.env.FAL_KEY
});

cloudinary.config({
  cloud_name: 'effichat',
  api_key: '656837556891128',
  api_secret: process.env.CLOUDINARY_API_SECRET, // Set this in your .env
  secure: true
});

// Helper to upload a remote video URL to Cloudinary
async function uploadVideoToCloudinary(videoUrl, publicId) {
  const axios = require('axios');
  const response = await axios({
    url: videoUrl,
    method: 'GET',
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        public_id: publicId,
        folder: 'generated_videos',
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    response.data.pipe(uploadStream);
  });
}

app.post('/api/image-to-video', async (req, res) => {
  console.log('POST /api/image-to-video', req.body);
  try {
    const { prompt, image_url } = req.body;
    // 1. Submit the job
    const submitRes = await fal.queue.submit("fal-ai/kling-video/v1/standard/image-to-video", {
      input: { prompt, image_url }
      // webhookUrl: "https://optional.webhook.url/for/results", // if you want webhooks
    });
    const requestId = submitRes.request_id;
    res.json({ requestId }); // Return the requestId to the frontend
  } catch (err) {
    console.error('FAL submit error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'FAL API error' });
  }
});

app.get('/api/task/:id', async (req, res) => {
  console.log('GET /api/task/:id', req.params.id);
  try {
    const { id } = req.params;
    // 2. Poll for status
    const statusRes = await fal.queue.status("fal-ai/kling-video/v1/standard/image-to-video", {
      requestId: id,
      logs: true,
    });
    // 3. If completed, fetch the result
    if (statusRes.status === 'COMPLETED') {
      const resultRes = await fal.queue.result("fal-ai/kling-video/v1/standard/image-to-video", {
        requestId: id
      });
      const videoUrl = resultRes.data?.video?.url;
      if (!videoUrl) return res.status(500).json({ error: 'No video URL from FAL' });
      // Upload to Cloudinary
      const publicId = `fal_video_${id}`;
      try {
        const cloudinaryResult = await uploadVideoToCloudinary(videoUrl, publicId);
        res.json({ status: 'COMPLETED', video: { url: cloudinaryResult.secure_url, public_id: cloudinaryResult.public_id }, requestId: id });
      } catch (cloudErr) {
        console.error('Cloudinary upload error:', cloudErr);
        res.status(500).json({ error: 'Cloudinary upload failed', details: cloudErr });
      }
    } else {
      res.json({ status: statusRes.status, requestId: id });
    }
  } catch (err) {
    console.error('FAL status/result error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'FAL API error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Proxy listening on port ${PORT}`));