import cors from 'cors';
import express from 'express';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Freelancer Protection & Trust Platform API',
    healthCheck: '/api/health',
    authRegister: '/api/auth/register',
    authLogin: '/api/auth/login',
    profile: '/api/users/profile',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Freelancer Protection & Trust Platform API is running',
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
