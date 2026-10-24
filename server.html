require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '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';
const stripe = Stripe(stripeSecretKey);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/checkout', async (req, res) => {
  try {
    const { name, email, paymentMethodId } = req.body;

    const customer = await stripe.customers.create({
      name: name,
      email: email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: 'price_1UUCqNRpwlS3XQTeWoAIbgXH' }],
      expand: ['latest_invoice.payment_intent'],
      off_session: true,
      payment_behavior: 'error_if_incomplete',
      proration_behavior: 'none',
    });

    const invoice = subscription.latest_invoice;
    const paymentIntent = invoice ? invoice.payment_intent : null;

    res.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: paymentIntent ? paymentIntent.client_secret : null
    });

  } catch (error) {
    console.error('Erro ao processar subscrição no Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor MZ TECH STORE a correr na porta ${PORT}`);
});
