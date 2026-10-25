const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const KEY_NAME = process.env.COINBASE_KEY_NAME;
const PRIVATE_KEY = process.env.COINBASE_PRIVATE_KEY;

// Função para gerar JWT de autenticação oficial da Coinbase CDP
function generateCoinbaseToken(requestMethod, requestPath) {
    const uri = `${requestMethod} api.cdp.coinbase.com${requestPath}`;
    const payload = {
        iss: 'cdp',
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 120,
        sub: KEY_NAME,
        uri: uri,
    };

    return jwt.sign(payload, PRIVATE_KEY, {
        algorithm: 'ES256',
        header: {
            kid: KEY_NAME,
            nonce: crypto.randomBytes(16).toString('hex')
        }
    });
}

// Endpoint para gerar a cobrança de 0.80 USDC
app.post('/api/create-crypto-charge', async (req, res) => {
    try {
        const path = '/v1/checkouts';
        const token = generateCoinbaseToken('POST', path);

        const response = await fetch('https://business.coinbase.com/api/v1/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: "0.80",
                currency: "USDC",
                description: "Pacote Preview - Liberação Imediata",
                redirect_url: "https://seusite.com/sucesso"
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao gerar cobrança');
        }

        res.json({
            success: true,
            checkout_url: data.checkout_url || data.hosted_url,
            checkout_id: data.id
        });

    } catch (error) {
        console.error('Erro na Coinbase:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para simular/processar Cartão de Crédito
app.post('/api/process-card', async (req, res) => {
    const { number, exp, cvc, name } = req.body;

    // Em produção real, você envia os dados para o Gateway do Stripe / Mercado Pago
    if (number && exp && cvc) {
        return res.json({
            success: true,
            transaction_id: 'TX-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            status: 'approved',
            amount: '0.80 USDC'
        });
    }

    res.status(400).json({ success: false, message: 'Dados do cartão inválidos.' });
});

app.listen(3000, () => {
    console.log('Servidor de Checkout rodando na porta 3000');
});
