import Stripe from "stripe";

// Server-side only. Never import this file from a client component.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export const STARTER_PRICE_USD = 49;
