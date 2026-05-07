import axios from "axios"


const api = axios.create({
    baseURL: "https://interviewiq-ath8.onrender.com",
    withCredentials: true
})

export async function register({ username, email, password }) {

    try {
        const response = await api.post('https://interviewiq-ath8.onrender.com/api/auth/register', {
            username, email, password
        })

        return response.data

    } catch (err) {

        console.log(err)

    }

}

export async function login({ email, password }) {

    try {

        const response = await api.post("https://interviewiq-ath8.onrender.com/api/auth/login", {
            email, password
        })

        return response.data

    } catch (err) {
        console.log(err)
    }

}

export async function logout() {
    try {

        const response = await api.get("https://interviewiq-ath8.onrender.com/api/auth/logout")

        return response.data

    } catch (err) {

    }
}

export async function getMe() {

    try {

        const response = await api.get("https://interviewiq-ath8.onrender.com/api/auth/get-me")

        return response.data

    } catch (err) {
        console.log(err)
    }

}