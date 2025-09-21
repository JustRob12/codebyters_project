// Client-side upload function using direct Cloudinary API
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'images'); // Using your existing preset

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dqhfbkdea/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cloudinary upload error:', errorText);
    throw new Error(`Upload failed: ${errorText}`);
  }

  const data = await response.json();
  return data.secure_url;
};
