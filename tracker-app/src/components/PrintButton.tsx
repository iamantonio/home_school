'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-accent-primary/20 hover:scale-105 transition-transform"
        >
            <Printer size={20} /> Print Official Transcript
        </button>
    )
}
