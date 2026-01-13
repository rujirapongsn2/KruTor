
export interface User {
    id: number;
    nickname: string;
    grade: string;
    summary_style?: 'SHORT' | 'DETAILED';
}

export interface SummaryRecord {
    id: number;
    user_id: number;
    title: string;
    content: any;
    created_at: string;
}

export interface QuizRecord {
    id: number;
    user_id: number;
    score: number;
    total_questions: number;
    timestamp: string;
    details?: any;
}

const API_Base = '/api';

export const apiService = {
    // Users
    getUsers: async (): Promise<User[]> => {
        const res = await fetch(`${API_Base}/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    },

    createUser: async (nickname: string, grade: string, summaryStyle?: string): Promise<User> => {
        const res = await fetch(`${API_Base}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, grade, summary_style: summaryStyle })
        });
        if (!res.ok) throw new Error('Failed to create user');
        return res.json();
    },

    updateUser: async (id: number, summaryStyle: string): Promise<User> => {
        const res = await fetch(`${API_Base}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary_style: summaryStyle })
        });
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
    },

    // Summaries
    saveSummary: async (userId: number, title: string, content: any): Promise<SummaryRecord> => {
        const res = await fetch(`${API_Base}/summaries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, title, content })
        });
        if (!res.ok) throw new Error('Failed to save summary');
        return res.json();
    },

    getSummaries: async (userId: number): Promise<SummaryRecord[]> => {
        const res = await fetch(`${API_Base}/summaries/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch summaries');
        return res.json();
    },

    // Quiz History
    saveQuizResult: async (userId: number, score: number, total: number, details?: any): Promise<QuizRecord> => {
        const res = await fetch(`${API_Base}/quiz-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, score: score, total_questions: total, details })
        });
        if (!res.ok) throw new Error('Failed to save result');
        return res.json();
    },

    getQuizHistory: async (userId: number): Promise<QuizRecord[]> => {
        const res = await fetch(`${API_Base}/quiz-history/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
    }
};
