const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentController = {
  // Create a payment intent
  async createPaymentIntent(req, res) {
    try {
      const { amount, currency = 'usd', email } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: currency,
        receipt_email: email, // Store email in the payment
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  },

  // Process webhook events from Stripe
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, // Make sure to get raw body
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          // Handle successful payment
          break;
        case 'payment_intent.payment_failed':
          // Handle failed payment
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = paymentController; 