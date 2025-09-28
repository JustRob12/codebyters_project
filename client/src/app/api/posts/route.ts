import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/posts - Fetch all posts
export async function GET() {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_pictures (picture_url, picture_order)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format the posts data
    const formattedPosts = posts.map((post: any) => ({
      ...post,
      pictures: post.post_pictures
        .sort((a: any, b: any) => a.picture_order - b.picture_order)
        .map((pic: any) => ({
          id: pic.picture_order,
          picture_url: pic.picture_url,
          picture_order: pic.picture_order
        }))
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, content, status = 'active', pictures = [], created_by } = body;

    // Validate required fields
    if (!title || !description || !content) {
      return NextResponse.json(
        { error: 'Title, description, and content are required' },
        { status: 400 }
      );
    }

    // Insert the post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert([{
        title,
        description,
        content,
        status,
        created_by: created_by || 1 // Default to admin user
      }])
      .select()
      .single();

    if (postError) {
      throw postError;
    }

    // Insert pictures if any
    if (pictures.length > 0) {
      const pictureInserts = pictures.map((url: string, index: number) => ({
        post_id: postData.id,
        picture_url: url,
        picture_order: index + 1
      }));

      const { error: picturesError } = await supabase
        .from('post_pictures')
        .insert(pictureInserts);

      if (picturesError) {
        throw picturesError;
      }
    }

    return NextResponse.json({ 
      message: 'Post created successfully',
      post: postData 
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
