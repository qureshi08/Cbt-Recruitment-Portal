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
            setStatus({ type: 'success', message: 'User account created successfully!' });
            setIsAdding(false);
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
        if (!confirm(`Are you sure you want to delete ${name}? Access will be revoked immediately.`)) return;

        const result = await deleteAdminUser(userId);
        if (result.success) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            setStatus({ type: 'success', message: 'Account deleted successfully.' });
        } else {
            setStatus({ type: 'error', message: result.error || 'Deletion failed.' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Key className="w-5 h-5 text-primary" />
                        User Management
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Manage system secondary administrators and their roles.</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingUser(null);
                        setStatus(null);
                    }}
                    className="btn-primary flex items-center gap-2 text-sm font-semibold rounded-xl shadow-sm"
                >
                    {isAdding ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isAdding ? "Cancel" : "Add New Admin"}
                </button>
            </div>

            {status && (
                <div className={cn(
                    "p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-in slide-in-from-top-4 duration-300",
                    status.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                )}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {status.message}
                </div>
            )}

            {/* Creation Panel */}
            {isAdding && (
                <div className="bg-white p-8 rounded-2xl border border-primary/20 shadow-lg animate-in zoom-in duration-200">
                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="fullName" required className="input-field pl-10 h-11" placeholder="Muhammad Anas" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="email" type="email" required className="input-field pl-10 h-11" placeholder="anas@cbt.com" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="password" required className="input-field pl-10 h-11" placeholder="Set password" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700">Assign Roles</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {availableRoles.map(role => (
                                    <label key={role.id} className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:border-primary transition-all">
                                        <input type="checkbox" name={`role-${role.name}`} className="w-4 h-4 accent-primary" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-700">{role.name}</span>
                                            <span className="text-xs text-gray-500">{role.description}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-3">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Panel */}
            {editingUser && (
                <div className="bg-white border border-yellow-200 p-8 rounded-2xl shadow-lg animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-yellow-600" />
                            Edit User: {editingUser.email}
                        </h4>
                        <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                    </div>

                    <form onSubmit={handleUpdateUser} className="space-y-6">
                        <div className="space-y-1.5 max-w-sm">
                            <label className="text-sm font-semibold text-gray-700">Update Name</label>
                            <input
                                name="fullName"
                                required
                                defaultValue={editingUser.full_name}
                                className="input-field h-11"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700">Update Roles</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {availableRoles.map(role => (
                                    <label key={role.id} className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:border-primary transition-all">
                                        <input
                                            type="checkbox"
                                            name={`role-${role.name}`}
                                            defaultChecked={editingUser.roles.includes(role.name)}
                                            className="w-4 h-4 accent-primary"
                                        />
                                        <span className="text-sm font-bold text-gray-700">{role.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="btn-primary">
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-border">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user: any) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                {user.full_name?.charAt(0) || user.email?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 leading-none mb-1">{user.full_name}</span>
                                                <span className="text-xs text-gray-500">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-wrap gap-1.5">
                                            {user.roles.map((role: string) => (
                                                <span key={role} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md border border-gray-200">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.full_name)}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
