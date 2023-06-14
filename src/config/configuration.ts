import * as process from "process";

export default () => ({
    db: {
        host: process.env.VPS_HOST,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    },
    jwt: process.env.JWT_SECRET,
    frontendUrl: process.env.FRONTEND_URL,
});