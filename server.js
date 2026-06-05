const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomBytes(8).toString('hex') + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype.replace('image/', ''))) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения'));
    }
  }
});

app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

app.post('/api/analyze', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Фото не загружено' });
  }

  const seed = crypto.createHash('md5').update(req.file.filename).digest();

  const b = (i) => seed[i % seed.length] / 255;

  const clothingScore = Math.round(30 + b(0) * 70);
  const postureScore = Math.round(25 + b(1) * 75);
  const groomingScore = Math.round(20 + b(2) * 80);
  const behaviorScore = Math.round(35 + b(3) * 65);
  const overallSafety = Math.round((clothingScore + postureScore + groomingScore + behaviorScore) / 4);

  const clothingNotes = [
    'Опрятная, чистая одежда',
    'Одежда немного помята, но приемлемо',
    'Спортивный стиль, удобная обувь',
    'Классический стиль, деловой вид',
    'Свободный стиль, повседневная одежда',
    'Яркая, привлекающая внимание одежда',
    'Тёмная однотонная одежда',
    'Многослойная одежда, свободный крой'
  ];

  const postureNotes = [
    'Уверенная, прямая осанка',
    'Расслабленная походка',
    'Немного сутулится, руки в карманах',
    'Быстрый, целенаправленный шаг',
    'Спокойная, неторопливая походка',
    'Энергичные движения'
  ];

  const verdicts = [
    { text: 'Вероятно, идёт к бабушке с пирожками 🥧', level: 'safe' },
    { text: 'Похож на соседа с 5-го этажа 🏠', level: 'safe' },
    { text: 'Скорее всего курьер с доставкой 📦', level: 'safe' },
    { text: 'Вероятно, студент — зачёты сами себя не сдадут 📚', level: 'neutral' },
    { text: 'Может быть сантехник, вызывали? 🔧', level: 'safe' },
    { text: 'Явно торопится — наверное, опаздывает на работу 💼', level: 'safe' },
    { text: 'Подозрительно улыбается — наверное, влюблён 💕', level: 'neutral' },
    { text: 'Несёт что-то тяжёлое — помочь бы надо! 💪', level: 'safe' },
    { text: 'Незнакомец, но выглядит мирно 🕊️', level: 'neutral' },
    { text: 'Идёт с собакой — значит, хороший человек 🐕', level: 'safe' },
    { text: 'Молодёжь нынче... но вроде приличный 👀', level: 'neutral' },
    { text: 'На вид порядочный гражданин ✅', level: 'safe' }
  ];

  const recommendations = [
    'Угостить пирожком для установления контакта',
    'Спросить, к кому идёт — стандартная процедура',
    'Кивнуть и поздороваться',
    'Продолжать наблюдение с лавочки',
    'Предложить семечки — свои люди не откажутся',
    'Поинтересоваться здоровьем бабушки/дедушки',
    'Одобрительно покачать головой',
    'Записать время прихода в блокнотик'
  ];

  const pick = (arr, idx) => arr[seed[idx] % arr.length];

  const result = {
    imageUrl: `/uploads/${req.file.filename}`,
    scores: {
      clothing: { value: clothingScore, note: pick(clothingNotes, 4) },
      posture: { value: postureScore, note: pick(postureNotes, 5) },
      grooming: { value: groomingScore, label: 'Ухоженность' },
      behavior: { value: behaviorScore, label: 'Поведение' }
    },
    overall: overallSafety,
    verdict: pick(verdicts, 6),
    recommendations: [pick(recommendations, 7), pick(recommendations, 8), pick(recommendations, 9)],
    timestamp: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
    disclaimer: 'ДЕМО-ВЕРСИЯ: Результаты сгенерированы случайно и не являются реальным анализом. Приложение создано исключительно в образовательных целях.'
  };

  res.json(result);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер "Польза" запущен на http://localhost:${PORT}`);
});
