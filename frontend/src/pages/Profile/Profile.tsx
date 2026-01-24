import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const Profile: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: 'Passionné par l\'apprentissage et le partage de connaissances.',
    phone: '+33 6 12 34 56 78',
    location: 'Paris, France',
  })

  const tabs = [
    { id: 'profile', name: 'Profil', icon: '👤' },
    { id: 'security', name: 'Sécurité', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'preferences', name: 'Préférences', icon: '⚙️' },
  ]

  const stats = [
    { label: 'Documents', value: '47', icon: '📄' },
    { label: 'Classes', value: '5', icon: '🏫' },
    { label: 'Partages', value: '128', icon: '🔗' },
    { label: 'Abonnés', value: '234', icon: '👥' },
  ]

  const handleSave = () => {
    toast.success('Profil mis à jour avec succès!')
    setIsEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Profile Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>
        <div className="relative p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center text-5xl text-white font-bold shadow-xl">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                📷
              </button>
            </div>

            {/* User Info */}
            <div className="text-center md:text-left text-white flex-1">
              <h1 className="text-3xl font-bold">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-white/80 mt-1">{user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                  {user?.role === 'STUDENT' ? '🎓 Étudiant' : user?.role === 'TEACHER' ? '👨‍🏫 Enseignant' : '👨‍👩‍👧 Parent'}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                  📍 Paris, France
                </span>
                <span className="px-3 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-full text-sm">
                  ✓ Vérifié
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center text-white">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="border-b border-gray-100">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                <button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    isEditing
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isEditing ? '💾 Sauvegarder' : '✏️ Modifier'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    disabled={!isEditing}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                      isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-4">
                <span className="text-2xl">🛡️</span>
                <div>
                  <p className="font-semibold text-emerald-800">Authentification à deux facteurs</p>
                  <p className="text-sm text-emerald-600">Renforcez la sécurité de votre compte</p>
                </div>
                <button className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                  Activer
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Changer le mot de passe</h4>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Mot de passe actuel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirmer le nouveau mot de passe"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg">
                    Mettre à jour
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {[
                { name: 'Nouveaux documents partagés', desc: 'Recevez une notification quand quelqu\'un partage un document avec vous', enabled: true },
                { name: 'Messages de classe', desc: 'Notifications pour les nouveaux messages dans vos classes', enabled: true },
                { name: 'Rappels de cours', desc: 'Rappels avant le début de vos cours', enabled: false },
                { name: 'Newsletter', desc: 'Recevez nos actualités par email', enabled: false },
              ].map((setting) => (
                <div key={setting.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">{setting.name}</p>
                    <p className="text-sm text-gray-500">{setting.desc}</p>
                  </div>
                  <button
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      setting.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        setting.enabled ? 'left-6' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500">
                  <option>🇫🇷 Français</option>
                  <option>🇬🇧 English</option>
                  <option>🇪🇸 Español</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thème</label>
                <div className="flex gap-4">
                  <button className="flex-1 p-4 border-2 border-indigo-500 bg-indigo-50 rounded-xl text-center">
                    <span className="text-2xl">☀️</span>
                    <p className="font-medium text-indigo-700 mt-1">Clair</p>
                  </button>
                  <button className="flex-1 p-4 border-2 border-gray-200 rounded-xl text-center hover:border-gray-300">
                    <span className="text-2xl">🌙</span>
                    <p className="font-medium text-gray-700 mt-1">Sombre</p>
                  </button>
                  <button className="flex-1 p-4 border-2 border-gray-200 rounded-xl text-center hover:border-gray-300">
                    <span className="text-2xl">💻</span>
                    <p className="font-medium text-gray-700 mt-1">Système</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Profile
