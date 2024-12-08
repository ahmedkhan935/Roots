import axios from 'axios';
import { BASE_URL } from './config';

export class MeritService {
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        auth: `${token}`
      }
    };
  }

  static async createMeritTemplate(points, reason) {
    return axios.post(`${BASE_URL}/merit/merit-template`, { points, reason }, this.getAuthHeaders());
  }

  static async createDemeritTemplate(points, reason) {
    return axios.post(`${BASE_URL}/merit/demerit-template`, { points, reason }, this.getAuthHeaders());
  }

  static async awardPoints(studentId, points, reason) {
    return axios.post(`${BASE_URL}/merit/award-points`, {
      studentId,
      points,
      reason
    }, this.getAuthHeaders());
  }

  static async getStudentPoints(studentId, filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return axios.get(`${BASE_URL}/merit/student-points/${studentId}?${queryParams}`, this.getAuthHeaders());
  }

  static async getMeritTemplates() {
    return axios.get(`${BASE_URL}/merit/merit-templates`, this.getAuthHeaders());
  }

  static async getDemeritTemplates() {
    return axios.get(`${BASE_URL}/merit/demerit-templates`, this.getAuthHeaders());
  }
}