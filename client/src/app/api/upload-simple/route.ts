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

    // Upload to Cloudinary using unsigned upload (requires preset)
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', new Blob([buffer]), file.name);
    cloudinaryFormData.append('upload_preset', 'images');
    cloudinaryFormData.append('folder', 'codebyters/events');

    console.log('Attempting upload to Cloudinary...');

    const cloudinaryResponse = await fetch(
      'https://api.cloudinary.com/v1_1/dqhfbkdea/image/upload',
      {
        method: 'POST',
        body: cloudinaryFormData
      }
    );

    console.log('Cloudinary response status:', cloudinaryResponse.status);

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary error response:', errorText);
      return NextResponse.json({ 
        error: 'Cloudinary upload failed', 
        details: errorText 
      }, { status: 500 });
    }

    const result = await cloudinaryResponse.json();
    console.log('Upload successful:', result.secure_url);

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
