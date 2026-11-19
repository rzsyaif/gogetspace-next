/**
 * Images used on the homepage and in the demo editor. The gallery is self-hosted; the photos below are
 * still served from the Framer project's CDN — move them into /public before the Framer site is retired.
 */
const framer = (id: string, ext = "png") => `https://framerusercontent.com/images/${id}.${ext}`

/** Homepage gallery: real previews this prototype generates (dentist, law firm, clinical lab), captured at 900px */
export const GALLERY_IMAGES = ["dental-calm", "law-classic", "lab-coral", "dental-warm", "law-direct", "lab-night", "law-discreet", "lab-mint"].map(
  (n) => `/images/gallery/${n}.jpg`,
)

/** Stock photos the demo editor swaps in when an image is "regenerated" */
export const STOCK_PHOTOS = [
  "FB2NWFWn8pLT14WMnhXg7EYJNNA",
  "hvo8LIviJtNuqp7uCBGYBv7RzN8",
  "7auDDu9MV9mKLv9w0U6Cj7u2NDA",
  "FeX4Wfmki4ZrF35YcmAf119TA",
  "FRtu9w2bkF57BHh0wLCuxy8rdog",
  "KxQcSCMbkbBvDAgjiX2roGaFA",
  "kAqvjhIu0NmVD6GJ2EammYZmHxQ",
  "PaRvHJ5ntnPa4Sug0UEQ6n7k",
].map((id) => framer(id))

/** Smiling woman holding lab results — used in the "Edit your site" card and the prompt demo files */
export const CLINIC_PHOTO = framer("UNenzXGFGPkkhea9M66yXbhT0NY")

/** Clinic storefront thumbnail for the prompt demo files */
export const CLINIC_FRONT = framer("7OKY0OwsFvEDENRXJLJ2pgNctQM")
