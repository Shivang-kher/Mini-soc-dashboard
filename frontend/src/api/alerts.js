import api from "./client";

export const fetchAlerts = async () => {
    const res = await api.get("/alerts");
    return res.data;
};

export const updateAlertStatus = async (id, status) => {
    const res = await api.patch(`/alerts/${id}/status`, { status });
    return res.data;
};
