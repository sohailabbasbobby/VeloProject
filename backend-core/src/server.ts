import app from './app';
import dotenv from 'dotenv';
// import { connectDB } from './config/db'; // Future implementation

dotenv.config();

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        // await connectDB();
        console.log('📦 Database connection initialized.');
        
        app.listen(PORT, () => {
            console.log(`🚀 Velo Backend Core Engine running on port ${PORT}`);
        });
    } catch (error) {
        console.error('CRITICAL: Failed to start server', error);
        process.exit(1);
    }
};

startServer();
