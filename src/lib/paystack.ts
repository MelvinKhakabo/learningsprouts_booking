import PaystackPop from '@paystack/inline-js';

export type PaystackChargeParams = {
  email: string;
  amount: number; // major units — e.g. 2500 for KSH 2,500, NOT subunits
  currency: 'KES' | 'USD';
  reference: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  onError: () => void;
};

export function openPaystackCheckout(params: PaystackChargeParams) {
  const popup = new PaystackPop();
  popup.newTransaction({
    key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    email: params.email,
    amount: Math.round(params.amount * 100), // Paystack expects amount in subunits
    currency: params.currency,
    reference: params.reference,
    onSuccess: (transaction: { reference: string }) => params.onSuccess(transaction.reference),
    onCancel: () => params.onClose(),
    onError: () => params.onError(),
  });
}