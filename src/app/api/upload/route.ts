import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];
    const subject = formData.get('subject') as string;
    const topic = formData.get('topic') as string;

    if (!files || !subject || !topic) {
      return new Response('Missing required fields', { status: 400 });
    }

    // For local development, save to public folder
    const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
    const topicPath = path.join(PUBLIC_DIR, subject, topic);

    // Ensure directory exists
    if (!fs.existsSync(topicPath)) {
      fs.mkdirSync(topicPath, { recursive: true });
    }

    // Save all files
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const filePath = path.join(topicPath, file.name);
      fs.writeFileSync(filePath, Buffer.from(buffer));
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Files uploaded successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response('Upload failed', { status: 500 });
  }
}
