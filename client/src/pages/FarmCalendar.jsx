import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  CalendarDays, Plus, Cloud, Sun, CloudRain, CloudSnow, 
  Wind, Clock, Loader2
} from 'lucide-react';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-toastify';

const localizer = momentLocalizer(moment);
const OWM_API_KEY = process.env.REACT_APP_OWM_API_KEY || '';

const getWeatherIcon = (condition) => {
  if (!condition) return Cloud;
  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sun')) return Sun;
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return CloudRain;
  if (c.includes('snow') || c.includes('sleet')) return CloudSnow;
  if (c.includes('wind')) return Wind;
  return Cloud;
};

const FarmCalendar = () => {
  const [events, setEvents] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [forecast, setForecast] = useState({});
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    crop: '', 
    date: moment().format('YYYY-MM-DD'),
    priority: 'medium',
    notes: ''
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/farm/tasks');
      if (res.data.success) {
        const sortedTasks = [...res.data.data].sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingTasks(sortedTasks.filter(t => moment(t.date).isSameOrAfter(moment(), 'day')).slice(0, 5));
        
        const formattedEvents = res.data.data.map(t => ({
          title: `[${t.crop}] ${t.task}`,
          start: new Date(t.date),
          end: new Date(t.date),
          allDay: true,
          resource: t
        }));
        setEvents(formattedEvents);
      }
    } catch (err) {
      toast.error('Failed to load farm tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetch7DayWeather = useCallback(async (lat, lon) => {
    if (!OWM_API_KEY) {
      setWeatherLoading(false);
      return;
    }

    try {
      // OWM 5-day / 3-hour forecast
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`
      );
      if (!res.ok) throw new Error('Weather API error');
      
      const data = await res.json();
      
      // Group by day
      const dailyMap = {};
      data.list.forEach(item => {
        const dateStr = item.dt_txt.split(' ')[0];
        if (!dailyMap[dateStr]) {
          dailyMap[dateStr] = {
            temps: [],
            conditions: [],
            pop: [] // Probability of precipitation
          };
        }
        dailyMap[dateStr].temps.push(item.main.temp);
        dailyMap[dateStr].conditions.push(item.weather[0].main);
        dailyMap[dateStr].pop.push(item.pop || 0);
      });

      const processedForecast = {};
      // Get max temp and most frequent condition for each of the 5 days
      Object.keys(dailyMap).forEach((date, index) => {
        const day = dailyMap[date];
        const maxTemp = Math.round(Math.max(...day.temps));
        const condition = day.conditions.sort((a,b) =>
            day.conditions.filter(v => v===a).length - day.conditions.filter(v => v===b).length
        ).pop();
        const rainProb = Math.round(Math.max(...day.pop) * 100);
        
        processedForecast[date] = { maxTemp, condition, rainProb };
      });

      // Extrapolate days 6 and 7 based on average trend if needed (optional, for UX)
      // For now, we show real 5-day data.
      setForecast(processedForecast);
    } catch (error) {
      console.error('Weather forecast fetch error:', error);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    
    // Get geolocation for real weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetch7DayWeather(pos.coords.latitude, pos.coords.longitude),
        () => setWeatherLoading(false)
      );
    } else {
      setWeatherLoading(false);
    }
  }, [fetch7DayWeather]);

  const handleSelectSlot = ({ start }) => {
    setNewTask({ ...newTask, date: moment(start).format('YYYY-MM-DD') });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.crop || !newTask.date) {
      toast.warning('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/farm/task', {
        crop: newTask.crop,
        task: newTask.title,
        date: newTask.date,
        priority: newTask.priority,
        notes: newTask.notes
      });
      if (res.data.success) {
        toast.success('Task scheduled successfully');
        setShowModal(false);
        setNewTask({ 
          title: '', crop: '', notes: '', 
          date: moment().format('YYYY-MM-DD'), priority: 'medium' 
        });
        fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to schedule task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500 border-red-600';
      case 'medium': return 'bg-amber-500 border-amber-600';
      case 'low': return 'bg-green-500 border-green-600';
      default: return 'bg-nature-600 border-nature-700';
    }
  };

  // Custom components for Big Calendar
  const components = {
    dateCellWrapper: ({ children, value }) => {
      const dateStr = moment(value).format('YYYY-MM-DD');
      const dayWeather = forecast[dateStr];
      
      return (
        <div className="relative h-full w-full">
          {children}
          {dayWeather && (
            <div className="absolute bottom-1 right-1 flex flex-col items-end pointer-events-none opacity-80 group">
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {dayWeather.maxTemp}°
                {React.createElement(getWeatherIcon(dayWeather.condition), { className: "w-3 h-3 text-blue-400" })}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-6 transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-nature-100 dark:bg-nature-900/30 rounded-2xl">
                  <CalendarDays className="w-8 h-8 text-nature-600 dark:text-nature-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Farm Planner
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Manage agronomy tasks with real-time weather integration
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-5 py-3 rounded-2xl">
                <Plus className="w-5 h-5" /> New Task
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar: Upcoming Tasks */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card p-5 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-nature-500" /> Upcoming
                </h3>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-nature-600" /></div>
                  ) : upcomingTasks.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4 italic">No pending tasks</p>
                  ) : (
                    upcomingTasks.map(task => (
                      <div key={task._id} className="group relative pl-4 border-l-2 border-nature-200 dark:border-nature-800 hover:border-nature-500 transition-colors">
                        <div className={`absolute left-[-2px] top-1 w-[4px] h-[14px] rounded-full ${getPriorityColor(task.priority)}`} />
                        <p className="text-xs text-nature-600 dark:text-nature-400 font-bold uppercase tracking-wider">
                          {moment(task.date).format('MMM DD')} • {task.crop}
                        </p>
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
                          {task.task}
                        </h4>
                        {task.notes && (
                           <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             {task.notes}
                           </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setShowModal(true)}
                  className="w-full mt-6 py-2 text-xs font-bold text-nature-600 dark:text-nature-400 border border-dashed border-nature-200 dark:border-nature-800 rounded-xl hover:bg-nature-50 dark:hover:bg-nature-900/10 transition-colors"
                >
                  + Add Milestone
                </button>
              </div>

              {/* Weather Forecast Mini-Card */}
              <div className="card p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-indigo-200 dark:shadow-none">
                 <h3 className="text-sm font-bold opacity-90 flex items-center gap-2 mb-4 uppercase tracking-widest">
                   <Cloud className="w-4 h-4" /> 5-Day Forecast
                 </h3>
                 <div className="space-y-3">
                   {weatherLoading ? (
                     <div className="flex justify-center py-4"><Loader2 className="animate-spin text-white/50" /></div>
                   ) : Object.keys(forecast).length === 0 ? (
                     <p className="text-xs opacity-70 italic text-center">Enable location for weather</p>
                   ) : (
                     Object.entries(forecast).slice(0, 5).map(([date, data]) => (
                       <div key={date} className="flex items-center justify-between text-xs py-1.5 border-b border-white/10 last:border-0">
                         <span className="font-medium opacity-80">{moment(date).format('ddd, DD')}</span>
                         <div className="flex items-center gap-3">
                           <span className="font-bold">{data.maxTemp}°C</span>
                           {React.createElement(getWeatherIcon(data.condition), { className: "w-4 h-4" })}
                         </div>
                       </div>
                     ))
                   )}
                 </div>
              </div>
            </div>

            {/* Main Calendar Panel */}
            <div className="lg:col-span-3">
              <div className="card p-6 min-h-[700px] bg-white dark:bg-gray-800">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  selectable
                  onSelectSlot={handleSelectSlot}
                  components={components}
                  style={{ height: 650 }}
                  className="font-sans dark:text-gray-200"
                  eventPropGetter={(event) => ({
                    className: `${getPriorityColor(event.resource.priority)} border-2 border-white/10 shadow-sm`,
                    style: { borderRadius: '8px', padding: '2px 6px', fontSize: '12px', fontWeight: 'bold' }
                  })}
                />
              </div>
            </div>
          </div>

          {/* New Task Modal - Enhanced Glassmorphism */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="card max-w-lg w-full p-8 shadow-3xl bg-white dark:bg-gray-800 border-none relative overflow-visible">
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute -top-3 -right-3 p-2 bg-white dark:bg-gray-700 shadow-lg rounded-full text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-nature-100 dark:bg-nature-900/40 rounded-2xl text-nature-600">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule Activity</h3>
                    <p className="text-gray-500 text-sm">Add a new farm task or crop milestone</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Crop / Target</label>
                      <input
                        type="text" required
                        value={newTask.crop}
                        onChange={(e) => setNewTask({ ...newTask, crop: e.target.value })}
                        placeholder="Wheat Sector A"
                        className="input-field"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Priority</label>
                      <select 
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        className="input-field appearance-none cursor-pointer"
                      >
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🔴 High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Task Title</label>
                    <input
                      type="text" required
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Apply irrigation, Harvesting, Sowing..."
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Scheduled Date</label>
                      <div className="relative">
                        <input
                          type="date" required
                          value={newTask.date}
                          onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                          className="input-field pl-10"
                        />
                        <CalendarDays className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Additional Notes (Optional)</label>
                    <textarea
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      placeholder="Specify tools, quantities, or special instructions..."
                      className="input-field min-h-[80px]"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={loading} className="btn-primary flex-1 py-4 text-lg">
                      {loading ? 'Processing...' : 'Schedule Activity'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

const X = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default FarmCalendar;
