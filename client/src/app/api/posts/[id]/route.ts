import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/posts/[id] - Fetch a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_pictures (picture_url, picture_order)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      throw error;
    }

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Format the post data
    const formattedPost = {
      ...post,
      pictures: post.post_pictures
        .sort((a: any, b: any) => a.picture_order - b.picture_order)
        .map((pic: any) => ({
          id: pic.picture_order,
          picture_url: pic.picture_url,
          picture_order: pic.picture_order
        }))
    };

    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update a post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, content, status, pictures = [] } = body;

    // Validate required fields
    if (!title || !description || !content) {
      return NextResponse.json(
        { error: 'Title, description, and content are required' },
        { status: 400 }
      );
    }

    // Update the post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .update({
        title,
        description,
        content,
        status
      })
      .eq('id', params.id)
      .select()
      .single();

    if (postError) {
      throw postError;
    }

    // Delete existing pictures
    const { error: deleteError } = await supabase
      .from('post_pictures')
      .delete()
      .eq('post_id', params.id);

    if (deleteError) {
      throw deleteError;
    }

    // Insert new pictures
    if (pictures.length > 0) {
      const pictureInserts = pictures.map((url: string, index: number) => ({
        post_id: parseInt(params.id),
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
      message: 'Post updated successfully',
      post: postData 
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete the post (this will cascade delete pictures due to foreign key constraint)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      message: 'Post deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
