import { FiUsers, FiGitBranch, FiBarChart2, FiUserPlus, FiCheckSquare } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const pages = [
  {
    title: 'User Sessions',
    description: 'View all users and their work sessions',
    path: '/sessions',
    icon: FiUsers,
    gradient: 'from-violet-600 to-fuchsia-600',
    bgGradient: 'from-violet-500/20 to-fuchsia-500/20',
  },
  {
    title: 'Team',
    description: 'Manage team members and add new users',
    path: '/team',
    icon: FiUserPlus,
    gradient: 'from-emerald-600 to-teal-600',
    bgGradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    title: 'Tasks',
    description: 'Manage tasks, track progress, and celebrate wins',
    path: '/tasks',
    icon: FiCheckSquare,
    gradient: 'from-amber-600 to-orange-600',
    bgGradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    title: 'Workflow View',
    description: 'Project-grouped view with work logs',
    path: '/workflow/:sessionId',
    icon: FiBarChart2,
    gradient: 'from-sky-600 to-blue-600',
    bgGradient: 'from-sky-500/20 to-blue-500/20',
    note: 'Requires session ID',
  },
  {
    title: 'Timeline View',
    description: 'Visual timeline of work segments and breaks',
    path: '/workflow-v2/:sessionId',
    icon: FiGitBranch,
    gradient: 'from-fuchsia-600 to-pink-600',
    bgGradient: 'from-fuchsia-500/20 to-pink-500/20',
    note: 'Requires session ID',
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text mb-3">
          SW Office Admin Panel
        </h1>
        <p className="text-gray-600 text-lg">
          Select a page to navigate to
        </p>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => {
          const Icon = page.icon;
          const isClickable = !page.note;

          return (
            <Link
              key={page.path}
              to={isClickable ? page.path : '#'}
              className={`group relative bg-white/40 backdrop-blur-md rounded-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 transition-all duration-300 ${
                isClickable
                  ? 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:border-white/40 hover:scale-105 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={(e) => !isClickable && e.preventDefault()}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${page.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative">
                <div className={`mb-4 inline-flex p-3 rounded-lg bg-gradient-to-r ${page.gradient}`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h2 className={`text-2xl font-semibold mb-3 font-outfit bg-gradient-to-r ${page.gradient} bg-clip-text text-transparent`}>
                  {page.title}
                </h2>

                <p className="text-gray-600 mb-4">
                  {page.description}
                </p>

                {page.note && (
                  <p className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full inline-block">
                    {page.note}
                  </p>
                )}
              </div>

              {/* Arrow indicator for clickable items */}
              {isClickable && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
} 