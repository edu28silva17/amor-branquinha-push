import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import webpush from 'web-push';
import cron from 'node-cron';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
app.use('/', express.static(path.join(__dirname, '../frontend')));

const SUBS_FILE = path.join(__dirname, 'subs.json');
const CONFIG_FILE = path.join(__dirname, 'schedule.json');

if (!fs.existsSync(SUBS_FILE)) fs.writeFileSync(SUBS_FILE, '[]');
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ morning:'08:00', afternoon:'14:00', night:'20:00' }, null, 2));

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const CONTACT = process.env.VAPID_CONTACT || 'mailto:example@example.com';

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  console.log('⚠️  VAPID keys ausentes. Rode:  npm run generate-keys');
}

webpush.setVapidDetails(CONTACT, PUBLIC_KEY, PRIVATE_KEY);

const loadSubs = () => JSON.parse(fs.readFileSync(SUBS_FILE));
const saveSubs = (data) => fs.writeFileSync(SUBS_FILE, JSON.stringify(data, null, 2));
const loadCfg = () => JSON.parse(fs.readFileSync(CONFIG_FILE));

app.get('/api/vapidPublicKey', (req,res)=> res.json({ publicKey: PUBLIC_KEY }));

app.post('/api/register', (req,res)=> {
  const { subscription } = req.body;
  if (!subscription) return res.status(400).json({ ok:false, error:'missing subscription' });
  const all = loadSubs();
  if (!all.find(s => s.endpoint === subscription.endpoint)) {
    all.push(subscription);
    saveSubs(all);
  }
  res.json({ ok:true });
});

app.post('/api/send-test', async (req,res)=>{
  const all = loadSubs();
  const payload = JSON.stringify({ title: 'Mensagem de carinho 💌', body: 'Teste: Branquinha, você é amada!' });
  await Promise.all(all.map(s => webpush.sendNotification(s, payload).catch(e=>console.log('push error', e.statusCode))));
  res.json({ ok:true, sent: all.length });
});

app.post('/api/schedule', (req,res)=> {
  const { morning, afternoon, night } = req.body;
  const cfg = loadCfg();
  if (morning) cfg.morning = morning;
  if (afternoon) cfg.afternoon = afternoon;
  if (night) cfg.night = night;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  res.json({ ok:true, cfg });
});

const frases = [
  'Bom dia, Branquinha! 🌞 Que seu dia seja tão doce quanto seu sorriso.',
  'Branquinha, você é o meu lugar favorito no mundo inteiro 💗',
  'Oi, Branquinha! Só passei pra lembrar que te amo muito 💘',
  'Com você, Branquinha, tudo faz mais sentido ✨',
  'Branquinha, cada batida do meu coração fala seu nome ❤️',
  'Sua risada é a trilha sonora do meu dia, Branquinha 😊',
  'Se eu pudesse compilar a felicidade, o resultado seria você, Branquinha.',
  'A vida fica cor-de-rosa quando penso em você, Branquinha 🌸',
  'Branquinha, você é meu bug favorito — porque não quero consertar 😄',
  'Só queria dizer: você é incrível, Branquinha! 💕',
  'Boa tarde, Branquinha! Que seu dia siga leve e lindo ☀️',
  'Você foi a melhor decisão da minha vida, Branquinha.',
  'Que sorte a minha ter você, Branquinha 🍀',
  'Eu te escolheria mil vezes, Branquinha 💞',
  'Nada é coincidência quando se trata de nós, Branquinha.',
  'Com saudade de você, Branquinha… sempre um pouquinho mais 💭',
  'Obrigada por existir, Branquinha. Você é meu universo ✨',
  'Boa noite, Branquinha! Que seus sonhos sejam doces como você 🌙',
  'Se amor tivesse versão 2.0, seria você, Branquinha — perfeito! 💻❤️',
  'Respira fundo, Branquinha. Eu tô aqui com você, sempre 🤍'
];
const pick = () => frases[Math.floor(Math.random()*frases.length)];

const jobFromHHMM = (hhmm) => {
  const [h, m] = hhmm.split(':').map(x=>parseInt(x,10));
  return `${m} ${h} * * *`;
};

let jobs = [];
function resetJobs(){
  jobs.forEach(j => j.stop());
  jobs = [];
  const cfg = loadCfg();
  const times = [cfg.morning, cfg.afternoon, cfg.night].filter(Boolean);
  times.forEach((t) => {
    const cronExp = jobFromHHMM(t);
    const j = cron.schedule(cronExp, async () => {
      const all = loadSubs();
      const payload = JSON.stringify({ title: 'Mensagem automática 💌', body: pick() });
      await Promise.all(all.map(s => webpush.sendNotification(s, payload).catch(e=>console.log('push error', e.statusCode))));
      console.log('Sent push to', all.length, 'subscribers at', t);
    }, { timezone: 'America/Sao_Paulo' });
    jobs.push(j);
  });
  console.log('Cron reloaded with', times);
}
resetJobs();

app.get('/api/debug/schedule', (req,res)=> res.json({ cfg: loadCfg() }));

const PORT = process.env.PORT || 8888;
app.listen(PORT, ()=> console.log('💖 Amor server on http://localhost:'+PORT));
