'use client'

import { Suspense } from 'react'
import { login, signup } from './actions'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
            <div className="max-w-md w-full glass-panel p-8 space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                        Tracker Login
                    </h2>
                    <p className="mt-2 text-text-secondary">
                        Sign in to manage your homeschool progress
                    </p>
                </div>

                {error && (
                    <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-xl text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-muted">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-bg-tertiary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-muted">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="mt-1 block w-full px-3 py-2 bg-bg-tertiary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            formAction={login}
                            className="flex-1 btn-primary text-sm shadow-md"
                        >
                            Sign in
                        </button>
                        <button
                            formAction={signup}
                            className="flex-1 py-2 px-4 border border-glass-border rounded-xl text-sm font-medium text-text-primary hover:bg-bg-tertiary transition-colors"
                        >
                            Sign up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg-primary text-white">Loading...</div>}>
            <LoginForm />
        </Suspense>
    )
}
