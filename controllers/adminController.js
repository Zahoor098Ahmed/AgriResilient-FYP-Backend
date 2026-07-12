import Detection from '../models/Detection.js';
import User from '../models/User.js';
import ContactSubmission from '../models/ContactSubmission.js';
import BlogPost from '../models/BlogPost.js';
import SiteContent from '../models/SiteContent.js';

// ---------- Image upload (team photos, testimonial photos, etc.) ----------

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const backendUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({
      success: true,
      data: { url: `${backendUrl}/uploads/${req.file.filename}` }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Reads page/limit query params (defaults: page 1, limit 10) and returns
// { page, limit, skip } plus a helper to shape the pagination metadata
// once the total count is known.
const getPagination = (req, defaultLimit = 10) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1);
  const skip = (page - 1) * limit;
  return {
    page,
    limit,
    skip,
    meta: (total) => ({ page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) })
  };
};

export const getAllDetections = async (req, res) => {
  try {
    const { page, limit, skip, meta } = getPagination(req);
    const [detections, total] = await Promise.all([
      Detection.find().sort('-createdAt').skip(skip).limit(limit),
      Detection.countDocuments()
    ]);
    res.status(200).json({
      success: true,
      count: detections.length,
      data: { detections, pagination: meta(total) }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip, meta } = getPagination(req);
    const [users, total] = await Promise.all([
      User.find().sort('-createdAt').skip(skip).limit(limit),
      User.countDocuments()
    ]);
    res.status(200).json({
      success: true,
      count: users.length,
      data: { users, pagination: meta(total) }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't delete your own admin account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(204).json({ success: true, data: null });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDetection = async (req, res) => {
  try {
    await Detection.findByIdAndDelete(req.params.id);
    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const totalDetections = await Detection.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Simple aggregation for most common objects
    const commonObjects = await Detection.aggregate([
      { $group: { _id: '$detectedObject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDetections,
        totalUsers,
        commonObjects
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Fills missing ur/sd translations with the English text so the public
// site never has to render a blank field just because an admin only
// filled in English — translations can be added later without breaking
// anything in the meantime.
const fillLocalizedFallback = (obj) => {
  if (!obj) return obj;
  return {
    en: obj.en || '',
    ur: obj.ur || obj.en || '',
    sd: obj.sd || obj.en || ''
  };
};

// ---------- Contact submissions ----------

export const getContactSubmissions = async (req, res) => {
  try {
    const { page, limit, skip, meta } = getPagination(req);
    const [submissions, total] = await Promise.all([
      ContactSubmission.find().sort('-createdAt').skip(skip).limit(limit),
      ContactSubmission.countDocuments()
    ]);
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: { submissions, pagination: meta(total) }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const submission = await ContactSubmission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.status(200).json({ success: true, data: { submission } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteContactSubmission = async (req, res) => {
  try {
    await ContactSubmission.findByIdAndDelete(req.params.id);
    res.status(204).json({ success: true, data: null });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ---------- Blog posts ----------

export const getAllBlogPostsAdmin = async (req, res) => {
  try {
    const { page, limit, skip, meta } = getPagination(req);
    const [posts, total] = await Promise.all([
      BlogPost.find().sort('-createdAt').skip(skip).limit(limit),
      BlogPost.countDocuments()
    ]);
    res.status(200).json({
      success: true,
      count: posts.length,
      data: { posts, pagination: meta(total) }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createBlogPost = async (req, res) => {
  try {
    const { title, excerpt, content, author, image, published } = req.body;

    if (!title?.en || !excerpt?.en || !content?.en) {
      return res.status(400).json({
        success: false,
        message: 'Title, excerpt, and content (at least in English) are required'
      });
    }

    const post = await BlogPost.create({
      title: fillLocalizedFallback(title),
      excerpt: fillLocalizedFallback(excerpt),
      content: fillLocalizedFallback(content),
      author,
      image,
      published
    });

    res.status(201).json({ success: true, data: { post } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateBlogPost = async (req, res) => {
  try {
    const { title, excerpt, content, author, image, published } = req.body;
    const updateData = {};
    if (title) updateData.title = fillLocalizedFallback(title);
    if (excerpt) updateData.excerpt = fillLocalizedFallback(excerpt);
    if (content) updateData.content = fillLocalizedFallback(content);
    if (author !== undefined) updateData.author = author;
    if (image !== undefined) updateData.image = image;
    if (published !== undefined) updateData.published = published;
    updateData.updatedAt = Date.now();

    const post = await BlogPost.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.status(200).json({ success: true, data: { post } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBlogPost = async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.status(204).json({ success: true, data: null });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ---------- Site content (About / Footer) ----------

export const getSiteContentAdmin = async (req, res) => {
  try {
    const { section } = req.params;
    if (!['about', 'footer', 'home'].includes(section)) {
      return res.status(400).json({ success: false, message: 'Invalid content section' });
    }
    const content = await SiteContent.findOne({ section });
    res.status(200).json({ success: true, data: { content } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSiteContent = async (req, res) => {
  try {
    const { section } = req.params;
    if (!['about', 'footer', 'home'].includes(section)) {
      return res.status(400).json({ success: false, message: 'Invalid content section' });
    }

    const updateData = { ...req.body, section, updatedAt: Date.now() };
    delete updateData._id;

    if (updateData.intro) updateData.intro = fillLocalizedFallback(updateData.intro);
    if (updateData.aboutBlurb) updateData.aboutBlurb = fillLocalizedFallback(updateData.aboutBlurb);
    if (updateData.address) updateData.address = fillLocalizedFallback(updateData.address);
    if (Array.isArray(updateData.values)) {
      updateData.values = updateData.values.map((v) => ({
        title: fillLocalizedFallback(v.title),
        desc: fillLocalizedFallback(v.desc)
      }));
    }
    if (Array.isArray(updateData.team)) {
      updateData.team = updateData.team.map((m) => ({
        name: m.name,
        role: fillLocalizedFallback(m.role),
        emoji: m.emoji,
        image: m.image
      }));
    }
    if (Array.isArray(updateData.testimonials)) {
      updateData.testimonials = updateData.testimonials.map((tItem) => ({
        name: fillLocalizedFallback(tItem.name),
        location: fillLocalizedFallback(tItem.location),
        text: fillLocalizedFallback(tItem.text),
        image: tItem.image,
        rating: tItem.rating || 5
      }));
    }

    const content = await SiteContent.findOneAndUpdate(
      { section },
      updateData,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: { content } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
