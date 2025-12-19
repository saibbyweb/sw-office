import { FiCalendar, FiDollarSign, FiCreditCard } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const pages = [
  {
    title: 'Work Exceptions',
    description: 'View employee leaves, late arrivals, and work exceptions',
    path: '/hr/work-exceptions',
    icon: FiCalendar,
    gradient: 'from-rose-600 to-pink-600',
    bgGradient: 'from-rose-500/20 to-pink-500/20',
  },
  {
    title: 'Payouts',
    description: 'View team performance metrics and compensation overview',
    path: '/hr/payouts',
    icon: FiDollarSign,
    gradient: 'from-amber-600 to-yellow-600',
    bgGradient: 'from-amber-500/20 to-yellow-500/20',
  },
  {
    title: 'Expenses',
    description: 'Track company expenses, reimbursements, and employee perks',
    path: '/hr/expenses',
    icon: FiCreditCard,
    gradient: 'from-cyan-600 to-blue-600',
    bgGradient: 'from-cyan-500/20 to-blue-500/20',
  },
];

export default function HRDashboard() {
  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold font-outfit text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text mb-3">
          HR Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Human Resources Management Portal
        </p>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => {
          const Icon = page.icon;

          return (
            <Link
              key={page.path}
              to={page.path}
              className="group relative bg-white/40 backdrop-blur-md rounded-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:border-white/40 hover:scale-105 cursor-pointer"
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
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
