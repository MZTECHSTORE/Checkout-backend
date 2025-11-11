// server.js - Backend Node.js completo para PayPal + M-Pesa
// Dependências: npm install express @paypal/checkout-server-sdk dotenv cors node-fetch
// Nota: Instale 'node-fetch' se não tiver: npm i node-fetch

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');
const fetch = require('node-fetch'); // Para chamadas HTTP no backend

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' })); // Ajuste para seu domínio GitHub Pages em produção

// Configuração PayPal
const paypalEnvironment = process.env.PAYPAL_MODE === 'live' 
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET_ID)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET_ID);
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

// Endpoint PayPal (existente)
app.post('/capturar-pagamento', async (req, res) => {
    const { orderID } = req.body;
    if (!orderID) return res.status(400).json({ error: 'orderID é obrigatório' });

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const capture = await paypalClient.execute(request);
        if (capture.statusCode === 201) {
            console.log('PayPal capturado:', capture.result);
            res.json({ success: true, details: capture.result, message: 'Pagamento PayPal realizado!' });
        } else {
            res.status(400).json({ error: 'Falha na captura PayPal', details: capture });
        }
    } catch (err) {
        console.error('Erro PayPal:', err);
        res.status(500).json({ error: 'Erro no PayPal', message: err.message });
    }
});

// Novo Endpoint M-Pesa: Processa pagamento via PayMoz API
app.post('/processar-mpesa', async (req, res) => {
    const { valor, numero_celular } = req.body;

    if (!valor || !numero_celular) {
        return res.status(400).json({ error: 'valor e numero_celular são obrigatórios' });
    }

    const apiKey = process.env.PAYMOZ_API_KEY;
    const apiUrl = 'https://paymoz.tech/api/v1/pagamentos/processar/';
    const headers = {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
    };
    const payload = {
        "metodo": "mpesa",
        "valor": valor,  // Ex: "100.00"
        "numero_celular": numero_celular  // Ex: "+254712345678"
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('M-Pesa processado:', data);
        
        // Assume response tem 'success' ou similar; ajuste se necessário
        if (data.success || data.status === 'success') {  // Adapte baseado no real response
            res.json({
                success: true,
                details: data,
                message: 'Pagamento M-Pesa iniciado! Verifique seu celular para confirmar.'
            });
        } else {
            res.status(400).json({ error: 'Falha no processamento M-Pesa', details: data });
        }
    } catch (err) {
        console.error('Erro M-Pesa:', err);
        res.status(500).json({ error: 'Erro na API M-Pesa', message: err.message });
    }
});

// Endpoint de saúde
app.get('/health', (req, res) => {
    res.json({ status: 'Servidor rodando (PayPal + M-Pesa)', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Servidor na porta ${PORT}`);
    console.log(`Modo PayPal: ${process.env.PAYPAL_MODE || 'sandbox'}`);
});

module.exports = app;
