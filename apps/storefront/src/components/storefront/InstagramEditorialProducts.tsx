import Image from 'next/image';
import { instagramProductsForLabel } from '../../data/instagramProducts';

export function InstagramEditorialProducts({ label }: { label: string }) {
  const products = instagramProductsForLabel(label);
  if (!products.length) return null;

  return <section className="store-section instagram-edit" aria-labelledby="instagram-edit-title">
    <header className="section-heading">
      <p className="eyebrow">From Instagram</p>
      <h2 id="instagram-edit-title">Featured pieces</h2>
      <p>Images and descriptions from public Lopaworld label posts.</p>
    </header>
    <ul className="instagram-product-grid">
      {products.map((product) => <li className="instagram-product-card" key={product.name}>
        <div className={`instagram-product-photos${product.photos.length > 1 ? ' has-gallery' : ''}`}>
          {product.photos.map((photo, index) => <div className="instagram-product-photo" key={photo.src}>
            <Image src={photo.src} alt={photo.alt} width={960} height={1200} priority={index === 0} />
          </div>)}
        </div>
        <div className="instagram-product-copy">
          <p className="eyebrow">{product.postedAt}</p>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          {product.credit && <p className="image-credit">{product.credit}</p>}
          <a className="text-link" href={product.postUrl} target="_blank" rel="noreferrer">View original Instagram post</a>
        </div>
      </li>)}
    </ul>
    <p className="empty-inline instagram-catalog-note">These are editorial references. Product availability, exact names, prices and variants still need to be matched to the live catalogue.</p>
  </section>;
}
