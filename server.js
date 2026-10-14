import app from './app.js';

const port = Number(process.env.PORT || 3000);

app.listen(port, () => console.log(`Open http://localhost:${port}`));