import axios from "axios";
import { BASE_URL } from "../config";


/**
 * Parent service class
 */

export default class ParentService {
    /**
     * Get children of a parent
     * @returns {Promise} Response containing children
     */
    static async getChildren(){
        return axios.get(`${BASE_URL}/parent/children`, {
            headers: {
                auth: `${localStorage.getItem('token')}`
            }
        });
    }
}
