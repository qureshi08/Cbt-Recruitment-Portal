"use client";

import { useState } from "react";
import {
    UserPlus,
    Shield,
    Mail,
    User,
    Trash2,
    CheckCircle,
    Lock,
    Pencil,
    X,
    AlertTriangle,
    Loader2,
    Key
} from "lucide-react";
import { createAdminUser, deleteAdminUser, updateAdminUser } from "@/app/actions";
import { cn } from "@/lib/utils";

interface UserManagerProps {
    initialUsers: any[];
    availableRoles: any[];
}

export default function UserManager({ initialUsers, availableRoles }: UserManagerProps) {
    const [users, setUsers] = useState(initialUsers);
    const [isAdding, setIsAdding] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus(null);
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const fullName = formData.get('fullName') as string;
        const password = formData.get('password') as string;
        const selectedRoles = availableRoles
            .filter(role => formData.get(`role-${role.name}`) === 'on')
            .map(role => role.name);

        if (selectedRoles.length === 0) {
            setStatus({ type: 'error', message: 'You must assign at least one permission.' });
            setIsSubmitting(false);
            return;
        }

        const result = await createAdminUser(email, fullName, selectedRoles, password);

        if (result.success) {
            setStatus({ type: 'success', message: 'User account initialized successfully! You can now log in with these credentials.' });
            setIsAdding(false);
            // Refresh local state or reload
            setTimeout(() => window.location.reload(), 1500);
        } else {
            setStatus({ type: 'error', message: result.error || 'Identity provider error.' });
        }
        setIsSubmitting(false);
    };

    const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingUser) return;

        setStatus(null);
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const fullName = formData.get('fullName') as string;
        const selectedRoles = availableRoles
            .filter(role => formData.get(`role-${role.name}`) === 'on')
            .map(role => role.name);

        const result = await updateAdminUser(editingUser.id, fullName, selectedRoles);

        if (result.success) {
            setStatus({ type: 'success', message: 'Permissions updated successfully!' });
            setEditingUser(null);
            setTimeout(() => window.location.reload(), 1000);
        } else {
            setStatus({ type: 'error', message: result.error || 'Update failed.' });
        }
        setIsSubmitting(false);
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (!confirm(`CRITICAL: Are you sure you want to delete ${name}? They will be logged out and blocked immediately.`)) return;

        const result = await deleteAdminUser(userId);
        if (result.success) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            setStatus({ type: 'success', message: 'Credentials revoked and account deleted.' });
        } else {
            setStatus({ type: 'error', message: result.error || 'Deletion failed.' });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-border">
                <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                        <Key className="w-6 h-6 text-primary" />
                        Identity & Access Management
                    </h3>
                    <p className="text-xs font-bold text-gray-400 mt-0.5">MANAGE SYSTEM OPERATORS AND PERMISSIONS</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingUser(null);
                        setStatus(null);
                    }}
                    className="btn-primary flex items-center gap-2 text-sm font-black uppercase tracking-widest px-6 py-4 rounded-2xl shadow-xl shadow-primary/20"
                >
                    {isAdding ? <X className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5" />}
                    {isAdding ? "Close Panel" : "Create New Admin"}
                </button>
            </div>

            {status && (
                <div className={cn(
                    "p-6 rounded-3xl flex items-center gap-4 text-sm font-black shadow-lg border animate-in slide-in-from-top-6 duration-500",
                    status.type === 'success' ? "bg-emerald-500 text-white border-emerald-400" : "bg-red-500 text-white border-red-400"
                )}>
                    {status.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    {status.message}
                </div>
            )}

            {/* Creation Panel */}
            {isAdding && (
                <div className="bg-gray-900 p-8 rounded-[40px] text-white animate-in zoom-in duration-300 shadow-2xl">
                    <form onSubmit={handleCreateUser} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Legal Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                    <input name="fullName" required className="w-full bg-black/40 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-colors font-bold" placeholder="e.g. Muhammad Anas" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Email ID</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                    <input name="email" type="email" required className="w-full bg-black/40 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-colors font-bold" placeholder="anas@cbt.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Access Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                    <input name="password" required className="w-full bg-black/40 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-primary transition-colors font-bold" placeholder="Set password" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Permission Matrix</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {availableRoles.map(role => (
                                    <label key={role.id} className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-[28px] cursor-pointer hover:bg-white/10 hover:border-primary/50 transition-all group">
                                        <input type="checkbox" name={`role-${role.name}`} className="w-5 h-5 accent-primary bg-transparent border-white/20 rounded" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white uppercase tracking-tighter">{role.name}</span>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase">{role.description}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary bg-primary hover:bg-white hover:text-primary border-none px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/40 transition-all active:scale-95"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Deploy Admin Credentials"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Panel */}
            {editingUser && (
                <div className="bg-white border-4 border-primary p-8 rounded-[40px] shadow-2xl animate-in slide-in-from-right duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                                <Pencil className="w-6 h-6 text-primary" />
                                Modify Access: {editingUser.email}
                            </h4>
                        </div>
                        <button onClick={() => setEditingUser(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
                    </div>

                    <form onSubmit={handleUpdateUser} className="space-y-8">
                        <div className="space-y-2 max-w-sm">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Updated Name</label>
                            <input
                                name="fullName"
                                required
                                defaultValue={editingUser.full_name}
                                className="input-field h-14 text-lg font-black"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Update Permission Set</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {availableRoles.map(role => (
                                    <label key={role.id} className="flex items-center gap-4 p-5 bg-gray-50 border border-gray-100 rounded-[28px] cursor-pointer hover:border-primary transition-all">
                                        <input
                                            type="checkbox"
                                            name={`role-${role.name}`}
                                            defaultChecked={editingUser.roles.includes(role.name)}
                                            className="w-5 h-5 accent-primary"
                                        />
                                        <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">{role.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="submit" disabled={isSubmitting} className="btn-primary px-12 py-5 rounded-3xl font-black uppercase shadow-xl shadow-primary/20">
                                {isSubmitting ? "Syncing..." : "Sync Credentials"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-border rounded-[40px] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-border">
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">IDENTIFIED OPERATOR</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">PERMISSION SET</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">SYSTEM ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xl shadow-lg">
                                            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-gray-900 leading-none mb-1">{user.full_name || 'Incognito User'}</span>
                                            <span className="text-xs text-gray-400 font-bold">{user.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles.map((role: string) => (
                                            <span key={role} className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-8 py-8 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="w-11 h-11 bg-white border border-gray-200 flex items-center justify-center rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                            title="Edit Operator"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                                            className="w-11 h-11 bg-white border border-gray-200 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            title="Revoke Access"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
