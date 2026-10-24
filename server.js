require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Stripe com a Secret Key do ambiente ou fallback direto
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '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';
const stripe = Stripe(stripeSecretKey);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve os ficheiros estáticos (checkout.html)

// ==========================================
// ROTA PRINCIPAL DE CHECKOUT (STRIPE)
// ==========================================
app.post('/api/checkout', async (req, res) => {
  try {
    const { amount, currency, email, name, description } = req.body;

    // Criar o Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 35000, // Valor em cêntimos/unidades mínimas (ex:50.00 MT = 5000)
      currency: currency || 'mzn',
      receipt_email: email,
      description: description || 'Compra na MZ TECH STORE',
      metadata: {
        cliente_nome: name || 'Cliente MZ TECH STORE',
        plataforma: 'MZ TECH STORE Web'
      },
      payment_method_types: ['card'] // Aceita Visa, Mastercard, etc.
    });

    // Devolve o clientSecret necessário para o frontend confirmar o pagamento
    res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (error) {
    console.error('Erro ao criar Intent de Pagamento:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// WEBHOOK DO STRIPE (Confirmação de Pagamento)
// ==========================================
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error(`Erro de validação no Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Notificação de pagamento concluído com sucesso
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log(`✅ Pagamento confirmado com sucesso para MZ TECH STORE! ID: ${paymentIntent.id}`);
    // Aqui pode adicionar a lógica para libertar a conta/produto ao cliente
  }

  res.json({ received: true });
});

// Rota de teste simples
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor de Checkout MZ TECH STORE a funcionar!' });
});

// Inicialização do Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Checkout MZ TECH STORE ativo na porta ${PORT}`);
});
