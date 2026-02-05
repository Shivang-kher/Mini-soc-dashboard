import api from "./client";

export const fetchEvents = async (queryParams = "") => {
    const res = await api.get(`/events${queryParams}`);
    return res.data;
};

