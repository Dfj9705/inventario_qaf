import { useState } from "react";
import api from "../api/axios";
export function useAuth() {
    const [user, setUser] = useState(null);
    async function login(email, password) {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", data.token); setUser(data.user);
    }
    function logout() { localStorage.removeItem("token"); setUser(null); }
    return { user, login, logout };
}
