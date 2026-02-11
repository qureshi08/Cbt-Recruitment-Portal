"use client";

import { useState } from "react";
import { UserPlus, Shield, Mail, User, Trash2, CheckCircle } from "lucide-react";
import { createAdminUser } from "@/app/actions";
import { cn } from "@/lib/utils";

interface UserManagerProps {
    initialUsers: any[];
    availableRoles: any[];
}

export default function UserManager({ initialUsers, availableRoles }: UserManagerProps) {
    const [users, setUsers] = useState(initialUsers);
    const [isAdding, setIsAdding] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const fullName = formData.get('fullName') as string;
        const selectedRoles = availableRoles
            .filter(role => formData.get(`role-${role.name}`) === 'on')
            .map(role => role.name);

        if (selectedRoles.length === 0) {
            setStatus({ type: 'error', message: 'Please select at least one role.' });
            return;
        }

        const result = await createAdminUser(email, fullName, selectedRoles);

        if (result.success) {
            setStatus({ type: 'success', message: 'User created successfully! Temporary password has been sent to their email.' });
            setIsAdding(false);
            // Refresh would typically happen via server components, but for UX we can prompt
            window.location.reload();
        } else {
            setStatus({ type: 'error', message: result.error || 'Failed to create user.' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    System Users
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-primary flex items-center gap-2 text-sm"
                >
                    <UserPlus className="w-4 h-4" />
                    Add New User
                </button>
            </div>

            {status && (
                <div className={cn(
                    "p-4 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2",
                    status.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                )}>
                    {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    {status.message}
                </div>
            )}

            {isAdding && (
                <div className="card border-primary/20 bg-primary/5 animate-in zoom-in duration-200">
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="fullName" required className="input-field pl-10" placeholder="e.g. Ali Ahmed" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input name="email" type="email" required className="input-field pl-10" placeholder="ali@cbt.com" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Assign Roles (Multiple allowed)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {availableRoles.map(role => (
                                    <label key={role.id} className="flex items-center gap-2 p-3 bg-white border border-border rounded cursor-pointer hover:border-primary transition-colors">
                                        <input type="checkbox" name={`role-${role.name}`} className="w-4 h-4 accent-primary" />
                                        <span className="text-sm font-medium text-gray-700">{role.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                            <button type="submit" className="btn-primary">Create User Account</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-border">
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Roles</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">{user.full_name}</span>
                                        <span className="text-xs text-gray-500">{user.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles.map((role: string) => (
                                            <span key={role} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
