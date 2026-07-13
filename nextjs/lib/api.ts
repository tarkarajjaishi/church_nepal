import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3002/api',
})

// Public API — no auth needed for reading
export async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const { data } = await api.get<T[]>(`/${endpoint}`)
  return data
}

export async function fetchOne<T>(endpoint: string, id: string): Promise<T> {
  const { data } = await api.get<T>(`/${endpoint}/${id}`)
  return data
}

export default api
