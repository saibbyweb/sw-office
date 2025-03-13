import { FiClock, FiUsers, FiFolder, FiCoffee, FiGitBranch } from 'react-icons/fi';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

// Dummy data to simulate the layout
const stats = {
  activeUsers: 12,
  totalHoursToday: "180.5",
  activeProjects: 8,
  onBreak: 3
};

const recentSessions = [
  {
    id: 1,
    user: { name: 'Sarah K.', avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+K' },
    status: 'ACTIVE',
    duration: '2h 15m',
    project: 'Website Redesign',
    startTime: new Date(),
  },
  {
    id: 2,
    user: { name: 'Mike R.', avatarUrl: 'https://ui-avatars.com/api/?name=Mike+R' },
    status: 'BREAK',
    duration: '1h 45m',
    project: 'Mobile App',
    startTime: new Date(),
  },
  // Add more dummy sessions as needed
];

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold font-outfit text-transparent bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link 
            to="/workflow"
            className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-2 text-gray-700 hover:bg-white/60 transition-all duration-200 border border-white/20"
          >
            <FiGitBranch className="text-fuchsia-500" />
            <span>View Workflow</span>
          </Link>
          <span className="text-gray-500">Last updated: {format(new Date(), 'HH:mm:ss')}</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="group bg-white/40 backdrop-blur-md rounded-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300 hover:border-white/40 animate-pulse-slow">
          <h2 className="text-gray-600 mb-2 font-medium tracking-wide">TOTAL HOURS TODAY</h2>
          <div className="flex items-baseline">
            <span className="text-8xl font-bold tracking-tight font-outfit bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              {stats.totalHoursToday}
            </span>
            <span className="text-2xl text-gray-400 ml-2 font-outfit">hours</span>
          </div>
          <div className="mt-6 flex gap-4">
            <button className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-fuchsia-500/25 active:scale-[0.98] group">
              <FiClock className="transition-transform group-hover:rotate-12" />
              <span className="relative z-10">View Sessions</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="group bg-white/40 backdrop-blur-md rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300 hover:border-white/40 animate-float">
            <div className="text-teal-500 mb-2 transition-transform duration-300 group-hover:scale-110">
              <FiUsers size={24} />
            </div>
            <h3 className="text-4xl font-bold mb-1 font-outfit bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              {stats.activeUsers}
            </h3>
            <p className="text-gray-600 text-sm">Active Users</p>
          </div>
          
          <div className="group bg-white/40 backdrop-blur-md rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300 hover:border-white/40 animate-float [animation-delay:200ms]">
            <div className="text-blue-500 mb-2 transition-transform duration-300 group-hover:scale-110">
              <FiFolder size={24} />
            </div>
            <h3 className="text-4xl font-bold mb-1 font-outfit bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              {stats.activeProjects}
            </h3>
            <p className="text-gray-600 text-sm">Active Projects</p>
          </div>

          <div className="group bg-white/40 backdrop-blur-md rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300 hover:border-white/40 animate-float [animation-delay:400ms]">
            <div className="text-amber-500 mb-2 transition-transform duration-300 group-hover:scale-110">
              <FiCoffee size={24} />
            </div>
            <h3 className="text-4xl font-bold mb-1 font-outfit bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {stats.onBreak}
            </h3>
            <p className="text-gray-600 text-sm">On Break</p>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white/40 backdrop-blur-md rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold font-outfit text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text">Active Sessions</h2>
          <button className="text-fuchsia-600 text-sm hover:text-fuchsia-700 transition-colors hover:underline underline-offset-4">
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-200/50">
          {recentSessions.map((session) => (
            <div key={session.id} className="py-4 flex items-center justify-between group hover:bg-white/40 rounded-lg transition-colors px-4 -mx-4">
              <div className="flex items-center gap-4">
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.name}
                  className="w-10 h-10 rounded-full ring-2 ring-white/50 group-hover:ring-fuchsia-500/50 transition-all duration-300 group-hover:scale-110"
                />
                <div>
                  <h3 className="font-medium text-gray-800">{session.user.name}</h3>
                  <p className="text-sm text-gray-500">{session.project}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                  session.status === 'ACTIVE' 
                    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 group-hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-600 ring-1 ring-amber-500/20 group-hover:bg-amber-100'
                }`}>
                  {session.status}
                </span>
                <span className="text-gray-500">{session.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 