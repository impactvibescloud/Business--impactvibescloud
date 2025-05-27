// export const API = "https://mantur-server.herokuapp.com";
// export const API = "https://api.tellytell.com";
export const API = "http://localhost:5000";
// export const API = "https://popstoreeee.herokuapp.com";

import { useEffect } from 'react';

//export const API = 'https://dating-api-server.herokuapp.com';
// export const API = 'http://localhost:5000';

export const buildType = 'development';
// export const buildType = 'production'

export const useLogger = (...params) => {
    useEffect(() => {
        console.log(...params);
    }, [params]);
};
