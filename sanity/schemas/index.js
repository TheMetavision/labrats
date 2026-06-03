// Schema registry for Labrats Studio.
//
// 2026-05-30: reconstructed alongside worldLocation, book, merchCategory
// (originals lost from local repo; rebuilt to match deployed Studio shape).
// Added contactSubmission for the new Sanity-backed contact form intake.
// 2026-06-03: added printfulVariant (object type) for the Wyrmfuel-model
// product schema, so the variants[].printfulVariants field resolves.
import character from './character';
import episode from './episode';
import blogPost from './blogPost';
import product from './product';
import printfulVariant from './printfulVariant';
import category from './category';
import faq from './faq';
import page from './page';
import book from './book';
import worldLocation from './worldLocation';
import merchCategory from './merchCategory';
import siteSettings from './siteSettings';
import legalPage from './legalPage';
import contactSubmission from './contactSubmission';
export const schemaTypes = [
  siteSettings,
  worldLocation,
  character,
  episode,
  blogPost,
  book,
  product,
  printfulVariant,
  category,
  merchCategory,
  faq,
  page,
  legalPage,
  contactSubmission,
];
