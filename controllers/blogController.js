import BlogPost from '../models/BlogPost.js';

export const getPublishedBlogPosts = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const posts = await BlogPost.find({ published: true }).sort('-createdAt');
    res.status(200).json({
      success: true,
      count: posts.length,
      data: { posts }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
