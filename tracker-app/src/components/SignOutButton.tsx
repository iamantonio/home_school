'use client'

import { LogOut } from 'lucide-react'
import { signOut } from '@/app/actions'

export default function SignOutButton() {
    return (
        <form action={signOut}>
            <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-glass-border"
                title="Sign Out"
            >
                <LogOut size={18} />
                <span className="text-sm font-medium">Log Out</span>
            </button>
        </form>
    )
}
