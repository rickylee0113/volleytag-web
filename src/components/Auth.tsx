import React, { useState } from 'react';
import { auth } from '../firebase';
import { Activity, ArrowRight, Loader2 } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') setError("帳號或密碼錯誤");
      else if (err.code === 'auth/email-already-in-use') setError("此信箱已被註冊");
      else if (err.code === 'auth/weak-password') setError("密碼長度需大於 6 位");
      else setError("發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in">
        <div className="bg-blue-600 p-8 text-center">
            <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                    <Activity className="text-blue-600 w-8 h-8" />
                </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">VolleyTag Cloud</h1>
            <p className="text-blue-100 mt-2 font-medium">專業排球數據記錄系統</p>
        </div>
        
        <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                {isLogin ? '歡迎回來' : '建立新帳號'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">電子信箱</label>
                    <input 
                        type="email" 
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-bold text-slate-700"
                        placeholder="coach@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">密碼</label>
                    <input 
                        type="password" 
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-bold text-slate-700"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-lg flex items-center gap-2">
                        ⚠️ {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (isLogin ? '登入系統' : '註冊帳號')}
                    {!loading && <ArrowRight size={20} />}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-slate-500 font-bold hover:text-blue-600 text-sm transition-colors"
                >
                    {isLogin ? '還沒有帳號？ 點此註冊' : '已經有帳號了？ 點此登入'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;