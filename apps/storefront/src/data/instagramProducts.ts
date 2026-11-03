export type InstagramEditorialProduct = {
  label: 'lopaworld' | 'men' | 'trybe' | 'prime' | 'fashion' | 'next' | 'bridal';
  name: string;
  description: string;
  postUrl: string;
  postedAt: string;
  photos: Array<{ src: string; alt: string }>;
  credit?: string;
};

/** Public product imagery sourced from Lopaworld's official fashion account. */
export const instagramEditorialProducts: InstagramEditorialProduct[] = [
  {
    label: 'lopaworld',
    name: 'Handcrafted crochet dress',
    description: 'A bold, colourful crochet dress with a one-shoulder silhouette.',
    postUrl: 'https://www.instagram.com/lopafashion/p/Dc03A3ejXvV/',
    postedAt: '3 September 2026',
    photos: [
      { src: '/media/instagram/lopaworld-crochet-dress-01.jpg', alt: 'Full-length view of the colourful crochet dress from LOPA FASHION.' },
      { src: '/media/instagram/lopaworld-crochet-dress-02.jpg', alt: 'Closer view of the crochet dress and one-shoulder neckline.' },
      { src: '/media/instagram/lopaworld-crochet-dress-03.jpg', alt: 'Front view of the crochet dress styled with a hat and accessories.' },
      { src: '/media/instagram/lopaworld-crochet-dress-04.jpg', alt: 'Back view of the colourful crochet dress.' },
    ],
  },
  {
    label: 'men',
    name: 'Gold flare set',
    description: 'Cropped top, flare pants and oversized bomber in metallic gold, styled with a soft pink accent.',
    postUrl: 'https://www.instagram.com/lopafashion/p/Dc_TX7eDTDO/',
    postedAt: '7 September 2026',
    photos: [
      { src: '/media/instagram/lopamen-gold-outfit-01.jpg', alt: 'Metallic gold cropped top, flared trousers and oversized bomber with a pink bag.' },
    ],
    credit: 'Photographer mark visible in source image: ACEPHOTO.ART.',
  },
  {
    label: 'trybe',
    name: 'Yoruba heritage Agbada',
    description: 'A richly embroidered brown Agbada styled with coral beads and a matching fila cap.',
    postUrl: 'https://www.instagram.com/lopa_trybe/p/DUD1PVkDSyB/',
    postedAt: '28 January 2026',
    photos: [
      { src: '/media/instagram/lopatrybe-yoruba-agbada-01.jpg', alt: 'Brown embroidered Yoruba Agbada displayed with coral beads and a matching fila cap.' },
    ],
  },
  {
    label: 'prime',
    name: 'Black suit with silver-grey piping',
    description: 'A formal black suit with contrasting silver-grey piping, presented by Lopa Prime.',
    postUrl: 'https://www.instagram.com/lopaprime/p/DLKvc2UioC_/',
    postedAt: '21 June 2025',
    photos: [
      { src: '/media/instagram/lopaprime-black-piped-suit-01.jpg', alt: 'Two models wearing black formal suits with silver-grey piping; Lopa Prime watermark in the image.' },
    ],
  },
  {
    label: 'fashion',
    name: 'Mustard embroidered set',
    description: 'A mustard two-piece set with signature green embroidery, shown in the Lopa Fashion campaign.',
    postUrl: 'https://www.instagram.com/lopafashion/p/DcwAThIjdsc/',
    postedAt: '1 September 2026',
    photos: [
      { src: '/media/instagram/lopafashion-mustard-embroidered-set-01.jpg', alt: 'Model wearing a mustard set with signature green embroidery and the Lopa Fashion watermark.' },
    ],
  },
  {
    label: 'next',
    name: 'Peach embroidered Asoebi gown',
    description: 'A peach fitted gown with intricate embroidery, sheer sleeves and a sculpted gold gele, featured in Lopa Next’s Asoebi collection.',
    postUrl: 'https://www.instagram.com/lopanext/p/Dc3zsrJDXDG/',
    postedAt: '4 September 2026',
    photos: [
      { src: '/media/instagram/lopanext-asoebi-gown-01.jpg', alt: 'Model wearing a peach embroidered Asoebi gown and gold gele; Lopa Next watermark in the image.' },
    ],
  },
  {
    label: 'bridal',
    name: 'Timeless white wedding gown',
    description: 'A bespoke white bridal gown with a fitted silhouette, lace-up back and flowing train, presented as a personal design made through fittings.',
    postUrl: 'https://www.instagram.com/lopabridal/p/DMaX3ZNou9s/',
    postedAt: '22 July 2025',
    photos: [
      { src: '/media/instagram/lopabridal-timeless-wedding-gown-01.jpg', alt: 'Bride wearing a white fitted wedding gown with a lace-up back, veil and long train; Lopa Bridal watermark in the image.' },
    ],
  },
];

export function instagramProductsForLabel(label: string) {
  return label === 'all' ? instagramEditorialProducts : instagramEditorialProducts.filter((product) => product.label === label);
}
