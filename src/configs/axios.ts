import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5194/api/", // Thay đổi URL cơ sở nếu cần
});

export default api;