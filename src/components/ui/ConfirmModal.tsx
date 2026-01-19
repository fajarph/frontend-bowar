import { X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    onConfirm,
    onCancel,
    type = 'warning'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const typeColors = {
        danger: {
            border: 'border-red-500/50',
            bg: 'from-red-500/20 to-red-600/20',
            buttonBg: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
            icon: '⚠️'
        },
        warning: {
            border: 'border-amber-500/50',
            bg: 'from-amber-500/20 to-amber-600/20',
            buttonBg: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
            icon: '⚠️'
        },
        info: {
            border: 'border-cyan-500/50',
            bg: 'from-cyan-500/20 to-blue-500/20',
            buttonBg: 'from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600',
            icon: 'ℹ️'
        }
    };

    const colors = typeColors[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className={`relative bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-black/50 backdrop-blur-xl animate-in zoom-in-95 duration-200`}>
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                >
                    <X className="w-4 h-4 text-slate-300" />
                </button>

                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl">
                    <span className="text-4xl">{colors.icon}</span>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 text-slate-200 py-3 rounded-2xl font-medium transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 bg-gradient-to-r ${colors.buttonBg} text-white py-3 rounded-2xl font-medium transition-all shadow-lg`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
