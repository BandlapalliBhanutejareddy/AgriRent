import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('Hello World'));
app.listen(4001, () => console.log('Simple server on 4001'));
