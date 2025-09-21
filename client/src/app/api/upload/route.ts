import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using signed upload (no preset needed)
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `codebyters/events/event_${timestamp}_${Math.random().toString(36).substring(7)}`;
    
    // Create signature for signed upload
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'esNk5HNgswaSeSST3LTDTjCxstY';
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = await import('crypto').then(crypto => {
      return crypto.createHash('sha1').update(stringToSign).digest('hex');
    });

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', new Blob([buffer]), file.name);
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '391248172642229');
    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('signature', signature);
    cloudinaryFormData.append('folder', 'codebyters/events');

    console.log('Upload parameters:', {
      publicId,
      timestamp,
      signature,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '391248172642229'
    });

    const cloudinaryResponse = await fetch(
      'https://api.cloudinary.com/v1_1/dqhfbkdea/image/upload',
      {
        method: 'POST',
        body: cloudinaryFormData
      }
    );

    // Log the response for debugging
    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary error response:', errorText);
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const result = await cloudinaryResponse.json();

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
