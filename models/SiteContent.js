import mongoose from 'mongoose';

const localizedString = { en: String, ur: String, sd: String };

// Single flexible document per "section" (e.g. 'about', 'footer') rather
// than separate collections — both are singleton-style editable content,
// and admin only ever reads/writes one section at a time.
const siteContentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    unique: true,
    enum: ['about', 'footer', 'home']
  },
  // About page fields
  intro: localizedString,
  values: [{
    title: localizedString,
    desc: localizedString
  }],
  team: [{
    name: String,
    role: localizedString,
    emoji: String,
    image: String
  }],
  // Footer fields
  aboutBlurb: localizedString,
  email: String,
  phone: String,
  address: localizedString,
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  // Home page fields
  testimonials: [{
    name: localizedString,
    location: localizedString,
    text: localizedString,
    image: String,
    rating: { type: Number, min: 1, max: 5, default: 5 }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const SiteContent = mongoose.model('SiteContent', siteContentSchema);

export default SiteContent;
