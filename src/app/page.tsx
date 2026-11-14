import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getSession } from '@/lib/auth';
import { 
  Sparkles, 
  Lightbulb, 
  CalendarDays, 
  Video, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  Youtube, 
  Instagram, 
  Layers,
  FileSpreadsheet,
  TrendingUp,
  Clock
} from 'lucide-react';

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar user={session} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Digital Content Workspace v1.0</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Plan. Create. Publish. <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Analyze.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The integrated all-in-one platform for modern content creators, streamers, and video producers to streamline ideation, publication schedules, and performance analytics.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all cursor-pointer"
              >
                Go to Your Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all cursor-pointer"
                >
                  Start Creating Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                >
                  Sign In with Demo Account
                </Link>
              </>
            )}
          </div>

          {/* Platform badges */}
          <div className="mt-12 flex items-center justify-center space-x-6 text-slate-400">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Supported Channels:</span>
            <span className="inline-flex items-center text-sm font-medium text-slate-600">
              <Youtube className="w-5 h-5 text-red-600 mr-1.5" /> YouTube
            </span>
            <span className="inline-flex items-center text-sm font-medium text-slate-600">
              <Instagram className="w-5 h-5 text-pink-600 mr-1.5" /> Instagram
            </span>
            <span className="inline-flex items-center text-sm font-medium text-slate-600">
              <span className="w-4 h-4 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-1.5">T</span> TikTok
            </span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
              Integrated Workflow
            </h2>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything creators need from first spark to monthly report
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Content Ideas Vault</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Capture brainstormed ideas instantly with tags, target platform, and status lifecycle (New Idea, Planned, In Production, Completed).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Planner & Calendar</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Schedule target publication dates with an intuitive monthly calendar view, platform badges, and production status progression.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Content Inventory</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Centralized archive for all published videos and posts, thumbnail previews, live URL links, and categorized platform metadata.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Analytics Dashboard</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Log and monitor views, likes, comments, shares, and audience subscriber growth over time with interactive visual charts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">PDF & CSV Reports</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate instant performance summaries for brand deals and reviews with date filters and one-click PDF/CSV export.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Enterprise-Grade Security</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bcrypt password hashing, SQL injection prevention, strict data ownership verification, and brute-force rate limiting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white">CreatorDesk</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} CreatorDesk. Plan. Create. Publish. Analyze.
          </p>
        </div>
      </footer>
    </div>
  );
}
