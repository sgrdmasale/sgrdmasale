import pb from '@/lib/pocketbaseClient.js';

export const API_SERVER_URL = '/hcgi/api';

const apiServerClient = {
    fetch: async (url, options = {}) => {
        const headers = new Headers(options.headers || {});
        if (pb.authStore.token) {
            headers.set('Authorization', `Bearer ${pb.authStore.token}`);
        }
        return await window.fetch(API_SERVER_URL + url, { ...options, headers });
    }
};

export default apiServerClient;

export { apiServerClient };
