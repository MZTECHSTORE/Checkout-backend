// server.js - Backend Node.js completo para recebimento PayPal + Vendorapay
// Dependências: npm install express @paypal/checkout-server-sdk dotenv cors axios

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// Configuração PayPal
const environment = process.env.PAYPAL_MODE === 'live' 
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET_ID)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET_ID);

const client = new paypal.core.PayPalHttpClient(environment);

// Rota raiz
app.get('/', (req, res) => {
    res.json({ 
        message: 'Backend MZ TECH STORE OK - PayPal + Vendorapay configurado',
        endpoints: {
            health: '/health',
            paypal: '/capturar-pagamento (POST)',
            vendorapay: '/processar-vendorapay (POST)'
        },
        mode: process.env.PAYPAL_MODE || 'sandbox'
    });
});

// Endpoint PayPal (mantido)
app.post('/capturar-pagamento', async (req, res) => {
    const { orderID } = req.body;
    if (!orderID) return res.status(400).json({ error: 'orderID é obrigatório' });

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const capture = await client.execute(request);
        if (capture.statusCode === 201) {
            res.json({ success: true, details: capture.result, message: 'Pagamento PayPal recebido!' });
        } else {
            res.status(400).json({ error: 'Falha na captura', details: capture });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Novo Endpoint Vendorapay (Processamento Direto com Credenciais)
app.post('/processar-vendorapay', async (req, res) => {
    const { apiKey, amount, cardNumber, cardExpiry, cardCvv, cardName, currency = 'MZN' } = req.body;

    if (!apiKey || !amount || !cardNumber || !cardExpiry || !cardCvv || !cardName) {
        return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    const VENDORAPAY_URL = 'https://vendorapay.com/api/payment/process'; // Endpoint para charge direto
    const headers = {
        'apiKey': apiKey,
        'Content-Type': 'application/json'
    };
    const payload = {
        amount: amount,
        currency: currency,
        cardNumber: cardNumber.replace(/\s/g, ''), // Limpa espaços
        cardExpiry: cardExpiry.replace('/', ''), // Limpa /
        cardCvv: cardCvv,
        cardName: cardName,
        enviroment: 'prod'
    };

    try {
        console.log('Processando Vendorapay:', payload);
        const response = await axios.post(VENDORAPAY_URL, payload, { headers });
        const data = response.data;

        if (data.success) {
            res.json({ success: true, message: 'Pagamento Vendorapay recebido!', transactionId: data.transactionId });
        } else {
            res.status(400).json({ error: data.error || 'Falha no processamento Vendorapay' });
        }
    } catch (err) {
        console.error('Erro Vendorapay:', err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data?.error || 'Erro de conexão Vendorapay' });
    }
});

// Health
app.get('/health', (req, res) => {
    res.json({ status: 'Servidor rodando - PayPal + Vendorapay OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Servidor na porta ${PORT}`);
    console.log(`Modo PayPal: ${process.env.PAYPAL_MODE || 'sandbox'}`);
});

module.exports = app;
