import { getBaseURL } from './config/api';

// Export API base URL derived from config/getBaseURL. getBaseURL returns the
// development URL in dev and the production URL (with /api suffix) in prod.
export const API = getBaseURL();

import { useEffect } from 'react';

//export const API = 'https://dating-api-server.herokuapp.com';
// export const API = 'http://localhost:5000';

export const buildType = process.env.NODE_ENV || 'development';
// export const buildType = 'production'

export const useLogger = (...params) => {
    useEffect(() => {
        console.log(...params);
    }, [params]);
};
