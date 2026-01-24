import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'

interface ClassroomType {
  id: string
  name: string
  subject: string
  teacher: string
  students: number
  color: string
  nextClass: string
  progress: number
  documents: number
  isActive: boolean
}

const Classroom: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [classrooms, setClassrooms] = useState<ClassroomType[]>([])
  const [loading, setLoading] = useState(true)
  const [joinLoading, setJoinLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    subject: 'Mathématiques',
    description: '',
    gradeLevel: 'N/A',
    maxStudents: 50,
  })

  const getColorForSubject = (subject: string): string => {
    const s = subject.toLowerCase()
    if (s.includes('math')) return 'from-blue-500 to-indigo-600'
    if (s.includes('phys') || s.includes('science')) return 'from-emerald-500 to-teal-600'
    if (s.includes('angl') || s.includes('lang')) return 'from-purple-500 to-pink-600'
    if (s.includes('hist') || s.includes('géo')) return 'from-orange-500 to-red-600'
    return 'from-indigo-500 to-purple-600'
  }

  const mapClassroomFromApi = (c: any): ClassroomType => ({
    id: c.id,
    name: c.name,
    subject: c.subject || 'Classe',
    teacher: c.creator ? `${c.creator.firstName} ${c.creator.lastName}` : 'Enseignant',
    students: c._count?.students ?? 0,
    color: getColorForSubject(c.subject || ''),
    nextClass: 'À venir',
    progress: 0,
    documents: c._count?.documents ?? 0,
    isActive: c.isActive ?? true,
  })

  const fetchClassrooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/classrooms')
      const data = response.data?.data || []
      setClassrooms(data.map(mapClassroomFromApi))
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des classes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchClassrooms()
  }, [])

  // Si on arrive via /dashboard/classroom/:id, on peut plus tard utiliser
  // routeClassroomId pour pré-sélectionner ou ouvrir un détail.

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      toast.error('Veuillez saisir un code de classe')
      return
    }

    try {
      setJoinLoading(true)
      await api.post('/classrooms/join', { code: joinCode.trim() })
      toast.success('Vous avez rejoint la classe')
      setShowJoinModal(false)
      setJoinCode('')
      await fetchClassrooms()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la jonction à la classe')
    } finally {
      setJoinLoading(false)
    }
  }

  const handleCreateClass = async () => {
    if (!createForm.name.trim()) {
      toast.error('Le nom de la classe est requis')
      return
    }

    try {
      setCreateLoading(true)
      const response = await api.post('/classrooms', {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        subject: createForm.subject,
        gradeLevel: createForm.gradeLevel,
        maxStudents: createForm.maxStudents,
      })

      const created = mapClassroomFromApi(response.data.data)
      setClassrooms(prev => [created, ...prev])
      toast.success('Classe créée avec succès!')
      setShowCreateModal(false)
      setCreateForm({
        name: '',
        subject: 'Mathématiques',
        description: '',
        gradeLevel: 'N/A',
        maxStudents: 50,
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la classe')
    } finally {
      setCreateLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏫 {t('classrooms.title')}</h1>
          <p className="text-gray-500 mt-1">{t('classrooms.desc')}</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowJoinModal(true)}
            type="button"
            className="px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2"
          >
            <span>🔗</span> {t('classrooms.join')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            type="button"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
          >
            <span>➕</span> {t('classrooms.create')}
          </motion.button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          const activeClasses = classrooms.filter(c => c.isActive).length
          const totalStudents = classrooms.reduce((sum, c) => sum + c.students, 0)
          const totalDocuments = classrooms.reduce((sum, c) => sum + c.documents, 0)
          const classesWithDocuments = classrooms.filter(c => c.documents > 0).length

          return [
            { label: 'Classes actives', value: activeClasses, icon: '🏫', bg: 'bg-blue-50', text: 'text-blue-600' },
            { label: 'Étudiants total', value: totalStudents, icon: '👥', bg: 'bg-emerald-50', text: 'text-emerald-600' },
            { label: 'Documents dans les classes', value: totalDocuments, icon: '📄', bg: 'bg-purple-50', text: 'text-purple-600' },
            { label: 'Classes avec documents', value: classesWithDocuments, icon: '📂', bg: 'bg-orange-50', text: 'text-orange-600' },
          ]
        })().map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl p-5 shadow-sm"
          >
            <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center text-xl mb-3`}>
              {stat.icon}
            </div>
            <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Classrooms Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      >
        {loading && classrooms.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500">
            {t('classrooms.loading')}
          </div>
        )}
        {classrooms.map((classroom) => (
          <motion.div
            key={classroom.id}
            variants={item}
            whileHover={{ y: -6 }}
            onClick={() => navigate(`/dashboard/classroom/${classroom.id}`)}
            className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
          >
            {/* Color Header */}
              <div className={`h-24 bg-gradient-to-r ${classroom.color} relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
              </div>
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-white/90 text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {classroom.subject}
                </span>
                <span className="text-white text-xl">
                  {classroom.subject === 'Maths' ? '📐' : classroom.subject === 'Sciences' ? '🔬' : classroom.subject === 'Langues' ? '🌍' : '📚'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                {classroom.name}
              </h3>
              <p className="text-gray-500 text-sm mt-1">{classroom.teacher}</p>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">{t('classrooms.progress')}</span>
                  <span className="font-semibold text-gray-700">{classroom.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${classroom.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full bg-gradient-to-r ${classroom.color}`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>👥</span>
                  <span>{classroom.students} {t('students')}</span>
                </div>
                <span className="text-xs text-gray-400">{classroom.nextClass}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add New Card */}
        <motion.button
          variants={item}
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowCreateModal(true)}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group min-h-[280px]"
        >
          <div className="w-16 h-16 bg-gray-200 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center transition-colors">
            <span className="text-3xl">➕</span>
          </div>
          <p className="font-semibold text-gray-600 group-hover:text-indigo-600 transition-colors">
            Créer une nouvelle classe
          </p>
        </motion.button>
      </motion.div>

      {/* Join Class Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔗</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Rejoindre une classe</h2>
                <p className="text-gray-500 mt-1">Entrez le code fourni par votre enseignant</p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Code de la classe (ex: ABC123)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  maxLength={6}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleJoinClass}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    {joinLoading ? 'Rejoindre...' : 'Rejoindre'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Class Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">➕ Créer une classe</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la classe</label>
                  <input
                    type="text"
                    placeholder="ex: Mathématiques 3ème A"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Matière</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={createForm.subject}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                  >
                    <option>Mathématiques</option>
                    <option>Physique-Chimie</option>
                    <option>SVT</option>
                    <option>Histoire-Géographie</option>
                    <option>Français</option>
                    <option>Anglais</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Décrivez votre classe..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateClass}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    {createLoading ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Classroom
