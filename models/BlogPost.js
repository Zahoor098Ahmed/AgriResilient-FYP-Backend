import mongoose from 'mongoose';

// Multi-language fields default the ur/sd variants to the English text at
// save time (in the controller) so the public site never has to handle a
// missing translation — admins can fill in ur/sd later without breaking
// anything in the meantime.
const localizedString = { en: String, ur: String, sd: String };

const blogPostSchema = new mongoose.Schema({
  title: localizedString,
  excerpt: localizedString,
  content: localizedString,
  author: {
    type: String,
    default: 'AgriResilient Team'
  },
  image: String,
  published: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;
