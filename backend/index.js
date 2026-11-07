import expres from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './router.js';

dotenv.config();

const app = expres();
app.use(cors());
app.use(expres.json());



const port = process.env.PORT || 3000;

app.use('/api', router)

app.listen(port, () => console.log("api running on port 3000"))

