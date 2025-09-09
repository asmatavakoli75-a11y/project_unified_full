import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import initializeDB from './models/index.js';

// Load env vars
dotenv.config();

const app = express();
app.use(express.json());

// Determine if the app is installed by checking for the lock file
const isInstalled = () => {
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    return fs.existsSync(path.join(currentDir, 'installer.lock'));
};

const startServer = async () => {
    // Apply Fallbacks
    const FALLBACK_ENV = {
        PORT: '3001', DB_HOST: '127.0.0.1', DB_USER: 'root',
        DB_PASSWORD: 'password', DB_NAME: 'clbp_db', DB_PORT: '3306',
        DB_DIALECT: 'mysql', JWT_SECRET: 'dev-fallback-secret',
        ADMIN_RESTART_TOKEN: 'dev-restart-key'
    };
    for (const [k, v] of Object.entries(FALLBACK_ENV)) {
        if (!process.env[k] || String(process.env[k]).trim() === '') {
            process.env[k] = v;
        }
    }

    const installerRoutes = (await import('./routes/installer.js')).default;
    app.use('/api/installer', installerRoutes);
    app.get('/api/status', (req, res) => {
        res.json({ installed: isInstalled() });
    });

    if (!isInstalled()) {
        console.log('Application not installed. Running in installer mode.');
    } else {
        try {
            console.log('Application is installed. Starting main server...');
            const db = await initializeDB();
            await db.sequelize.sync();
            console.log('Database synchronized.');

            // Dynamically import and mount main routes
            const routes = [
                { path: '/api/questionnaires', module: './routes/questionnaires.js' },
                { path: '/api/settings', module: './routes/settings.js' },
                { path: '/api/reports', module: './routes/reports.js' },
                { path: '/api/users', module: './routes/users.js' },
                { path: '/api/predict', module: './routes/predict.js' },
                { path: '/api/data', module: './routes/data.js' },
                { path: '/api/dashboard', module: './routes/dashboard.js' },
                { path: '/api/assessments', module: './routes/assessments.js' },
                { path: '/api/notes', module: './routes/notes.js' },
                { path: '/api/analysis', module: './routes/analysis.js' },
                { path: '/api/analysis-adv', module: './routes/analysis_adv.js' },
                { path: '/api/models', module: './routes/models.js' },
                { path: '/api/flags', module: './routes/flags.js' },
            ];
            for (const route of routes) {
                const { default: router } = await import(route.module);
                app.use(route.path, router);
            }
            console.log('Main application routes mounted.');

        } catch (error) {
            console.error('Failed to start main application:', error);
            process.exit(1); // Exit if the main app fails to start
        }
    }

    const port = process.env.PORT || 3001;
    const server = app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        if (!isInstalled()) {
            console.log('Navigate to the frontend to begin installation.');
        }
    });

    return server;
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export { app, startServer };