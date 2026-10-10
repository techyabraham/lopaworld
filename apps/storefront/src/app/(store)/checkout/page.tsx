import { CheckoutForm } from '../../../components/checkout/CheckoutForm';

export const dynamic = 'force-dynamic';

export default function CheckoutPage() {
  return <main className="store-page checkout-page"><p className="eyebrow">Lopaworld</p><h1>Checkout</h1><CheckoutForm /></main>;
}
