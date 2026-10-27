/**
 * Images used on the homepage. They are served from the Framer project's CDN for now —
 * move the files into /public and point these paths at them when the Framer site is retired.
 */
const framer = (id: string, ext = "png") => `https://framerusercontent.com/images/${id}.${ext}`

export const GALLERY_IMAGES = [
  "FB2NWFWn8pLT14WMnhXg7EYJNNA",
  "hvo8LIviJtNuqp7uCBGYBv7RzN8",
  "7auDDu9MV9mKLv9w0U6Cj7u2NDA",
  "FeX4Wfmki4ZrF35YcmAf119TA",
  "FRtu9w2bkF57BHh0wLCuxy8rdog",
  "KxQcSCMbkbBvDAgjiX2roGaFA",
  "kAqvjhIu0NmVD6GJ2EammYZmHxQ",
  "PaRvHJ5ntnPa4Sug0UEQ6n7k",
].map((id) => framer(id))

export const AVATARS = [
  "P00VHzNRbq1FeML8ezd9drvcJMY",
  "cX6qUw9Lk4sDWg1SMo7UVQEt1mg",
  "G4aEEUi2TAg3gh2sHfwBlotc",
  "ulHeE9hkm3GyXVEeC0OYEHLroU",
].map((id) => framer(id))

/** Smiling woman holding lab results — used in the "Edit your site" card and the prompt demo files */
export const CLINIC_PHOTO = framer("UNenzXGFGPkkhea9M66yXbhT0NY")

/** Clinic storefront thumbnail for the prompt demo files */
export const CLINIC_FRONT = framer("7OKY0OwsFvEDENRXJLJ2pgNctQM")
