import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, DollarSign, Activity, Plus, Trash2, Edit2, 
  ChevronRight, ArrowLeft, Save, X, LayoutDashboard, 
  Dumbbell, CreditCard, TrendingUp
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface AdminPanelProps {
  onClose: () => void;
  token: string;
}

export default function AdminPanel({ onClose, token }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'workouts' | 'plans'>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (activeTab === 'dashboard') {
        const res = await fetch('/api/admin/stats', { headers });
        setStats(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', { headers });
        setUsers(await res.json());
      } else if (activeTab === 'workouts') {
        const res = await fetch('/api/workouts');
        setWorkouts(await res.json());
      } else if (activeTab === 'plans') {
        const res = await fetch('/api/plans');
        setPlans(await res.json());
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkout = async (workout: any) => {
    try {
      const res = await fetch('/api/admin/workouts', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workout)
      });
      if (res.ok) {
        setEditingWorkout(null);
        fetchData();
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    try {
      const res = await fetch(`/api/admin/workouts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-zinc-900 border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="text-black w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
        </div>

        <nav className="space-y-2 flex-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'workouts', label: 'Workouts', icon: Dumbbell },
            { id: 'plans', label: 'Pricing', icon: CreditCard },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-500 text-black font-semibold' 
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={onClose}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to App
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-zinc-950">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={activeTab}
          >
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="text-emerald-500" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Users</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="text-emerald-500" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Revenue</span>
                    </div>
                    <div className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</div>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="text-emerald-500" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Growth Rate</span>
                    </div>
                    <div className="text-3xl font-bold text-white">+12.5%</div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-6">Revenue Overview</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.revenueByDay}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/100}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white">Recent Payments</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-white/10">
                          <th className="px-6 py-4 font-semibold">User</th>
                          <th className="px-6 py-4 font-semibold">Amount</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {stats.recentPayments.map((payment: any) => (
                          <tr key={payment.id} className="text-zinc-300 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">{payment.email}</td>
                            <td className="px-6 py-4 text-white font-medium">${(payment.amount / 100).toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase rounded-md">
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-sm">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">User Management</h3>
                  <div className="text-sm text-zinc-500">{users.length} total users</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="px-6 py-4 font-semibold">Email</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Subscription</th>
                        <th className="px-6 py-4 font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user: any) => (
                        <tr key={user.id} className="text-zinc-300 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                              user.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-zinc-500/10 text-zinc-500'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.subscription_end_date ? (
                              <span className="text-emerald-500">Elite (Ends {new Date(user.subscription_end_date).toLocaleDateString()})</span>
                            ) : (
                              <span className="text-zinc-500">Free Tier</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-zinc-500 text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'workouts' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white">Workout Library</h3>
                  <button 
                    onClick={() => setEditingWorkout({
                      id: Math.random().toString(36).substr(2, 9),
                      name: '',
                      description: '',
                      rounds: 6,
                      fight_time: 180,
                      rest_time: 60,
                      category: 'Technique',
                      difficulty: 'Beginner',
                      is_premium: false,
                      instructions: []
                    })}
                    className="bg-emerald-500 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-colors"
                  >
                    <Plus size={20} />
                    New Workout
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workouts.map((workout: any) => (
                    <div key={workout.id} className="bg-zinc-900/50 border border-white/10 p-6 rounded-2xl group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-zinc-400 uppercase">
                          {workout.category}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingWorkout(workout)}
                            className="p-2 text-zinc-500 hover:text-white transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{workout.name}</h4>
                      <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{workout.description}</p>
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Activity size={14} />
                          {workout.rounds} Rounds
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard size={14} />
                          {workout.is_premium ? 'Elite' : 'Free'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">Subscription Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan: any) => (
                    <div key={plan.id} className="bg-zinc-900/50 border border-white/10 p-8 rounded-2xl">
                      <div className="text-emerald-500 font-bold mb-2">{plan.name}</div>
                      <div className="text-4xl font-bold text-white mb-6">${plan.price}</div>
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature: string, idx: number) => (
                          <li key={idx} className="text-zinc-400 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition-colors">
                        Edit Plan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Workout Editor Modal */}
      {editingWorkout && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
              <h3 className="text-xl font-bold text-white">
                {editingWorkout.id ? 'Edit Workout' : 'New Workout'}
              </h3>
              <button onClick={() => setEditingWorkout(null)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Workout Name</label>
                  <input 
                    type="text" 
                    value={editingWorkout.name}
                    onChange={(e) => setEditingWorkout({...editingWorkout, name: e.target.value})}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                  <select 
                    value={editingWorkout.category}
                    onChange={(e) => setEditingWorkout({...editingWorkout, category: e.target.value})}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                  >
                    <option>Technique</option>
                    <option>Stamina</option>
                    <option>Power</option>
                    <option>Speed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                <textarea 
                  value={editingWorkout.description}
                  onChange={(e) => setEditingWorkout({...editingWorkout, description: e.target.value})}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Rounds</label>
                  <input 
                    type="number" 
                    value={editingWorkout.rounds}
                    onChange={(e) => setEditingWorkout({...editingWorkout, rounds: parseInt(e.target.value)})}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Fight (s)</label>
                  <input 
                    type="number" 
                    value={editingWorkout.fight_time}
                    onChange={(e) => setEditingWorkout({...editingWorkout, fight_time: parseInt(e.target.value)})}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Rest (s)</label>
                  <input 
                    type="number" 
                    value={editingWorkout.rest_time}
                    onChange={(e) => setEditingWorkout({...editingWorkout, rest_time: parseInt(e.target.value)})}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="is_premium"
                  checked={editingWorkout.is_premium}
                  onChange={(e) => setEditingWorkout({...editingWorkout, is_premium: e.target.checked})}
                  className="w-5 h-5 rounded bg-zinc-950 border-white/10 text-emerald-500"
                />
                <label htmlFor="is_premium" className="text-sm font-bold text-white uppercase">Premium Workout</label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-zinc-900/50 flex gap-4">
              <button 
                onClick={() => setEditingWorkout(null)}
                className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSaveWorkout(editingWorkout)}
                className="flex-1 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save Workout
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
