const BASE_URL = 'http://localhost:8080/api/v1.0';
const apiEndpoint = {
   FETCH_FILES: `${BASE_URL}/files/my`,
   GET_CREDITS: `${BASE_URL}/users/credits`,
   TOGGLE_FILE: (id) => `${BASE_URL}/files/${id}/toggle-public`,
    DOWNLOAD_FILE: (id) => `${BASE_URL}/files/download/${id}`,
    DELETE_FILE: (id) => `${BASE_URL}/files/${id}`,
    UPLOAD_FILES: `${BASE_URL}/files/upload`,
    CREATE_ORDER: `${BASE_URL}/payments/create-order`,
    VERIFY_PAYMENT: `${BASE_URL}/payments/verify-payment`,
    GET_TRANSACTIONS: `${BASE_URL}/transactions`,
    GET_PUBLIC_FILE: (id) => `${BASE_URL}/files/public/${id}`,
};
export default apiEndpoint ;