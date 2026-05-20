import { motion } from 'framer-motion'
import { Star, MapPin, Users, Briefcase, Award } from 'lucide-react'

export default function TutorMarketplace() {
  const tutors = [
    {
      id: 1,
      name: 'Priya Sharma',
      subjects: ['Math', 'Physics'],
      experience: 5,
      rating: 4.9,
      students: 32,
      bio: 'Passionate educator with 5 years of experience. Specializes in STEM.',
      image: '👩‍🏫',
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      subjects: ['English', 'History'],
      experience: 8,
      rating: 4.8,
      students: 45,
      bio: 'Experienced tutor dedicated to making learning engaging and fun.',
      image: '👨‍🏫',
    },
    {
      id: 3,
      name: 'Anaya Verma',
      subjects: ['Science', 'Biology'],
      experience: 6,
      rating: 5.0,
      students: 28,
      bio: 'Expert in making complex concepts simple and understandable.',
      image: '👩‍🔬',
    },
    {
      id: 4,
      name: 'Vikram Singh',
      subjects: ['Music', 'Arts'],
      experience: 10,
      rating: 4.7,
      students: 52,
      bio: 'Creative tutor bringing imagination and passion to every lesson.',
      image: '🎨',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">Expert Tutors</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Connect with verified tutors who track learning outcomes and integrate seamlessly with Master-Kids
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass p-8 rounded-2xl mb-12 card-hover"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search tutors..."
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
          <select className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50">
            <option>All Subjects</option>
            <option>Math</option>
            <option>English</option>
            <option>Science</option>
          </select>
          <select className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50">
            <option>All Ratings</option>
            <option>5 Stars</option>
            <option>4+ Stars</option>
          </select>
        </div>
      </motion.div>

      {/* Tutor Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"
      >
        {tutors.map((tutor) => (
          <motion.div
            key={tutor.id}
            variants={itemVariants}
            whileHover={{ y: -10 }}
            className="glass p-8 rounded-3xl card-hover group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="text-6xl">{tutor.image}</div>
              <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-2 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                <span className="font-bold text-yellow-400">{tutor.rating}</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-2">{tutor.name}</h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {tutor.subjects.map((subject) => (
                <span
                  key={subject}
                  className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-semibold"
                >
                  {subject}
                </span>
              ))}
            </div>

            <p className="text-slate-300 mb-6 leading-relaxed">{tutor.bio}</p>

            <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-white/10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  <span className="text-2xl font-bold">{tutor.experience}</span>
                </div>
                <p className="text-xs text-slate-400">Years</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-2xl font-bold">{tutor.students}</span>
                </div>
                <p className="text-xs text-slate-400">Students</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span className="text-2xl font-bold">Top</span>
                </div>
                <p className="text-xs text-slate-400">Coach</p>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all group-hover:scale-105">
              Connect & Book
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-16 glass p-12 rounded-3xl text-center card-hover"
      >
        <h2 className="text-3xl font-bold mb-4">Are you a tutor?</h2>
        <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
          Join our marketplace and unlock access to families actively looking for expert educators. Your session logs feed directly into parent dashboards.
        </p>
        <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/50">
          Apply as Tutor
        </button>
      </motion.div>
    </div>
  )
}
