export default {
  name: 'siteSettings', title: 'Site Settings', type: 'document',
  fields: [
    { name: 'siteName', title: 'Site Name', type: 'string', initialValue: 'Labrats' },
    { name: 'tagline', title: 'Tagline', type: 'string', initialValue: 'Where Genius Meets Mischief!' },
    { name: 'siteDescription', title: 'Site Description', type: 'text', rows: 3, initialValue: 'Labrats is an animated sci-fi series following genetically enhanced lab rats fighting for freedom. Explore the book series, meet the characters, and join the rebellion.' },
    { name: 'contactEmail', title: 'Contact Email', type: 'string', initialValue: 'contact@labrats.uk' },
    { name: 'youtubeChannel', title: 'YouTube Channel URL', type: 'url' },
    { name: 'socialLinks', title: 'Social Links', type: 'array', of: [{ type: 'object', fields: [{ name: 'platform', title: 'Platform', type: 'string', options: { list: ['Instagram', 'TikTok', 'X', 'Facebook', 'YouTube', 'Threads'] } }, { name: 'url', title: 'URL', type: 'url' }] }] },
    { name: 'announcementBar', title: 'Announcement Bar', type: 'string' },
    { name: 'logo', title: 'Logo', type: 'image' },
    { name: 'footerLogo', title: 'Footer Logo', type: 'image' },
    { name: 'footerText', title: 'Footer Text', type: 'text', rows: 2, initialValue: '© The Metavision 2026. All rights reserved.' },
    { name: 'newsletterHeadline', title: 'Newsletter Headline', type: 'string', initialValue: 'Join the Rebellion' },
    { name: 'newsletterSubtext', title: 'Newsletter Subtext', type: 'string', initialValue: 'Lab dispatches, mission reports, and first access to merch drops.' },
  ],
  __experimental_actions: ['update', 'publish'],
};
