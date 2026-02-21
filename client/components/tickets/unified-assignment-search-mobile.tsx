'use client';

import React, { useState, useEffect } from 'react';
import { User, Users, Search, X, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/http';

interface UnifiedAssignmentSearchMobileProps {
  assignedTo: string | null;
  assignedGroupId: string | null;
  onAssign: (type: 'user' | 'group' | 'none', value: string | null) => void;
}

export function UnifiedAssignmentSearchMobile({ assignedTo, assignedGroupId, onAssign }: UnifiedAssignmentSearchMobileProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/users`).then(res => res.json()).then(setUsers);
    fetch(`${API_URL}/groups`).then(res => res.json()).then(setGroups);
  }, []);

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          className="w-full bg-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          placeholder="Buscar técnico o grupo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2">
        {filteredUsers.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2">Técnicos</p>
            {filteredUsers.map(user => (
              <button 
                key={user.id} 
                onClick={() => onAssign('user', user.email)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl transition-all",
                  assignedTo === user.email ? "bg-emerald-50 border-emerald-100 border" : "bg-white border-slate-100 border"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-100 text-slate-600">{user.name?.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-[10px] text-slate-500">{user.email}</p>
                  </div>
                </div>
                {assignedTo === user.email && <Check size={18} className="text-emerald-600" />}
              </button>
            ))}
          </div>
        )}

        {filteredGroups.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2">Grupos</p>
            {filteredGroups.map(group => (
              <button 
                key={group._id} 
                onClick={() => onAssign('group', group._id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl transition-all",
                  assignedGroupId === group._id ? "bg-blue-50 border-blue-100 border" : "bg-white border-slate-100 border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Users size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{group.name}</p>
                  </div>
                </div>
                {assignedGroupId === group._id && <Check size={18} className="text-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
