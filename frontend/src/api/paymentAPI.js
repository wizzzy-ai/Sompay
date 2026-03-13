import api from './axios';

export const paymentAPI = {
  // Get user's payment history
  getMyPayments: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/history${queryString ? '?' + queryString : ''}`;
      console.log('Fetching payments from:', url);
      const response = await api.get(url);
      console.log('Payment response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching payments:', error.response?.data || error.message);
      console.error('Full error:', error);
      throw error;
    }
  },


  // Initiate a real payment
  initiatePayment: async (data) => {
    try {
      console.log('Initiating payment with data:', data);
      const response = await api.post('/payments/initiate', data);
      console.log('Initiate payment response:', response);
      return response;
    } catch (error) {
      console.error('Error initiating payment:', error.response?.data || error.message);
      console.error('Full error:', error);
      throw error;
    }
  },

  // Get all payments (admin)
  getAllPayments: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/all${queryString ? '?' + queryString : ''}`;
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching all payments:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get recent payments
  getRecentPayments: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/recent${queryString ? '?' + queryString : ''}`;
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching recent payments:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get current user's due amount for a month/year
  getMyDue: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/due${queryString ? '?' + queryString : ''}`;
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching due amount:', error.response?.data || error.message);
      throw error;
    }
  },
};
