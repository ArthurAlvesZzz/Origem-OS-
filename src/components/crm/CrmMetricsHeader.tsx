import React from 'react';
import { Kanban, DollarSign, MessageSquare, Clock } from 'lucide-react';

interface CrmMetricsHeaderProps {
    openDealsCount: number;
    pipelineValue: number;
    unreadInbox: number;
    lateFollowUps: number;
}

export function CrmMetricsHeader({ openDealsCount, pipelineValue, unreadInbox, lateFollowUps }: CrmMetricsHeaderProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-2">
            <div className="bg-[#100C08] border border-[#C59868]/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Kanban size={32} className="text-[#C59868]" />
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    Negócios Abertos
                </div>
                <div className="text-3xl font-heading font-medium text-zinc-50">
                    {openDealsCount}
                </div>
            </div>

            <div className="bg-[#100C08] border border-[#C59868]/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={32} className="text-[#C59868]" />
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    Valor em Pipeline
                </div>
                <div className="text-3xl font-heading font-medium text-[#C59868]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(pipelineValue)}
                </div>
            </div>

            <div className="bg-[#100C08] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <MessageSquare size={32} className="text-zinc-500" />
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    Inbox não lidas
                </div>
                <div className="flex items-end gap-2">
                    <div className="text-3xl font-heading font-medium text-zinc-50">{unreadInbox}</div>
                    {unreadInbox > 0 && <span className="text-[10px] bg-[#C59868] text-[#100C08] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1.5">Atenção</span>}
                </div>
            </div>

            <div className="bg-[#100C08] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Clock size={32} className="text-zinc-500" />
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    Follow-ups Atrasados
                </div>
                <div className="flex items-end gap-2">
                    <div className="text-3xl font-heading font-medium text-zinc-50">{lateFollowUps}</div>
                    {lateFollowUps > 0 && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mb-1.5">Agir</span>}
                </div>
            </div>
        </div>
    );
}
