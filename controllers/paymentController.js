const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentController = {
  // Create a payment intent
  async createPaymentIntent(req, res) {
    try {
      console.log('Creating payment intent...');
      const { amount, currency = 'usd' } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: currency,
      });

      console.log('Payment intent created successfully');
      res.status(200).json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error('Error creating payment intent:', error.message);
      res.status(500).json({
        error: error.message
      });
    }
  },

  // Process webhook events from Stripe
  async handleWebhook(req, res) {
    console.log('Received webhook from Stripe');
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, // Make sure to get raw body
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('Webhook event type:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('Payment succeeded:', paymentIntent.id);
          // Handle successful payment
          break;
        case 'payment_intent.payment_failed':
          console.log('Payment failed:', event.data.object.id);
          // Handle failed payment
          break;
        default:
          console.log('Unhandled event type');
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error.message);
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = paymentController; 