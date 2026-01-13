import React, { useState, useEffect } from 'react';
import { User, apiService } from '../services/apiService';

interface ProfileSelectorProps {
    onUserSelected: (user: User) => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({ onUserSelected }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [nickname, setNickname] = useState('');
    const [grade, setGrade] = useState('ป.4');
    const [summaryStyle, setSummaryStyle] = useState<'SHORT' | 'DETAILED'>('SHORT');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await apiService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname) return;
        try {
            const newUser = await apiService.createUser(nickname, grade, summaryStyle);
            onUserSelected(newUser);
        } catch (error) {
            alert('สร้างบัญชีไม่สำเร็จ');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-blue-800 mb-8">สวัสดีจ้า! 👋</h1>

                {!isCreating && users.length > 0 ? (
                    <div>
                        <h2 className="text-xl text-gray-700 mb-4 font-semibold">เลือกชื่อของตัวเองนะ:</h2>
                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => onUserSelected(user)}
                                    className="w-full text-left p-4 rounded-xl border-2 border-blue-100 hover:border-blue-400 hover:bg-blue-50 transition-all flex justify-between items-center group"
                                >
                                    <span className="font-bold text-lg text-gray-800 group-hover:text-blue-700">{user.nickname}</span>
                                    <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">{user.grade}</span>
                                </button>
                            ))}
                        </div>
                        <div className="text-center">
                            <p className="text-gray-500 mb-2">หรือ</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                สร้างบัญชีใหม่
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">ชื่อเล่น</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg"
                                placeholder="เช่น น้องต้น"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="grade-select" className="block text-gray-700 font-bold mb-2">ชั้นเรียน</label>
                            <select
                                id="grade-select"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none text-lg bg-white"
                                title="เลือกชั้นเรียน"
                            >
                                {['ป.4', 'ป.5', 'ป.6'].map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        {/* Summary Style Preference */}
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">ชอบสรุปแบบไหน?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSummaryStyle('SHORT')}
                                    className={`p-3 rounded-lg border-2 text-center transition-all ${summaryStyle === 'SHORT' ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    แบบสั้น (Short)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSummaryStyle('DETAILED')}
                                    className={`p-3 rounded-lg border-2 text-center transition-all ${summaryStyle === 'DETAILED' ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    แบบละเอียด (Detailed)
                                </button>
                            </div>
                            <p className="text-sm mt-3 p-3 bg-blue-50 text-blue-800 rounded-lg">
                                {summaryStyle === 'SHORT'
                                    ? "💡 แบบสั้น: อ่านง่าย สรุปมาให้เน้นๆ แต่อย่าลืมหาความรู้เพิ่มเติมนะจ๊ะ หรือถามครู AI ได้เลย"
                                    : "📚 แบบละเอียด: เนื้อหาครบถ้วน ควรอ่านให้จบเพื่อความเข้าใจที่ลึกซึ้งนะจ๊ะ ไม่เข้าใจตรงไหนถามครู AI ได้"}
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all"
                        >
                            เริ่มเรียนกันเลย! 🚀
                        </button>

                        {users.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="w-full text-gray-500 mt-4 hover:text-gray-700"
                            >
                                กลับไปเลือกชื่อเดิม
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default ProfileSelector;
