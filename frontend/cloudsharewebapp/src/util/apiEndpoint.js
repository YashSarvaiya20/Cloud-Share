const BASE_URL = 'http://localhost:8080/api/v1.0';
const apiEndpoint = {
   FETCH_FILES: `${BASE_URL}/files/my`,
   GET_CREDITS: `${BASE_URL}/users/credits`,
   TOGGLE_FILE: (id) => `${BASE_URL}/files/${id}/toggle-public`,
    DOWNLOAD_FILE: (id) => `${BASE_URL}/files/download/${id}`,
    DELETE_FILE: (id) => `${BASE_URL}/files/${id}`,
    UPLOAD_FILES: `${BASE_URL}/cloudinary/upload`,
    PAYMENT_STATUS: `${BASE_URL}/payments/status`,
    CREATE_ORDER: `${BASE_URL}/payments/create-order`,
    VERIFY_PAYMENT: `${BASE_URL}/payments/verify-payment`,
    GET_TRANSACTIONS: `${BASE_URL}/transactions`,
    GET_PUBLIC_FILE: (id) => `${BASE_URL}/files/public/${id}`,
    VIEW_FILE: (id) => `${BASE_URL}/files/view/${id}`,
    GET_FILE_VERSIONS: (id) => `${BASE_URL}/files/${id}/versions`,
    RESTORE_FILE_VERSION: (id, versionId) => `${BASE_URL}/files/${id}/restore/${versionId}`,
    SHARE_CREATE: `${BASE_URL}/share/create`,
    SHARE_BY_TOKEN: (token) => `${BASE_URL}/share/${token}`,
    SHARE_STREAM: (token) => `${BASE_URL}/share/${token}/stream`,
    SHARE_DOWNLOAD: (token) => `${BASE_URL}/share/${token}/download`,
    STREAM_FILE: (id) => {
        const encodedPath = String(id)
            .split('/')
            .map((segment) => encodeURIComponent(segment))
            .join('/');
        return `${BASE_URL}/files/stream/${encodedPath}`;
    },
};
export default apiEndpoint ;