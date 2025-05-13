/**
 * Service for handling API calls to the backend
 */
import axios from 'axios';

class GraphAPIService {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.axios = axios.create({
      baseURL: this.baseUrl,
    });
  }

  /**
   * Test connectivity to the backend
   * @returns {Promise} - Promise that resolves with the response data
   */
  async testConnectivity() {
    try {
      const response = await this.axios.get('/testConnectivity');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get graph data from the backend
   * @returns {Promise} - Promise that resolves with the graph data
   */
  async getGraphData() {
    try {
      const response = await this.axios.get('/graph');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save graph data to the backend
   * @param {Object} graphData - The graph data to save
   * @returns {Promise} - Promise that resolves with the response data
   */
  async saveGraphData(graphData) {
    try {
      const response = await this.axios.post('/graph', graphData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const graphAPIService = new GraphAPIService();
export default graphAPIService;
