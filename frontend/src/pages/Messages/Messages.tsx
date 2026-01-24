import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'

interface ClassroomItem {
  id: string
  name: string
  subject?: string
  studentsCount: number
}

interface MessageItem {
  id: string
  content: string
  createdAt: string
  userName: string
  isOwn: boolean
}

const Messages: React.FC = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([])
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoadingClasses(true)
        const response = await api.get('/classrooms')
        const data = response.data?.data || []
        const mapped: ClassroomItem[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          studentsCount: c._count?.students ?? 0,
        }))
        setClassrooms(mapped)
        if (mapped.length > 0) {
          setSelectedClassroomId(mapped[0].id)
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors du chargement des classes')
      } finally {
        setLoadingClasses(false)
      }
    }

    void fetchClassrooms()
  }, [])

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedClassroomId) return
      try {
        setLoadingMessages(true)
        const response = await api.get(`/classrooms/${selectedClassroomId}/messages`, {
          params: { page: 1, limit: 100 },
        })
        const data = response.data?.data || []
        const mapped: MessageItem[] = data.map((m: any) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt,
          userName: m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Utilisateur',
          isOwn: m.userId === user?.id,
        }))
        setMessages(mapped)
        setTimeout(scrollToBottom, 50)
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors du chargement des messages')
      } finally {
        setLoadingMessages(false)
      }
    }

    void fetchMessages()
  }, [selectedClassroomId, user?.id])

  const handleSend = async () => {
    if (!input.trim() || !selectedClassroomId) return

    try {
      setSending(true)
      const response = await api.post(`/classrooms/${selectedClassroomId}/messages`, {
        content: input.trim(),
      })
      const m = response.data?.data
      const newMessage: MessageItem = {
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Moi',
        isOwn: true,
      }
      setMessages(prev => [...prev, newMessage])
      setInput('')
      setTimeout(scrollToBottom, 50)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi du message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId) || null

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-7rem)]">
      {/* Sidebar - Classes */}
      <div className="w-full lg:w-72 flex-shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('messages.title')}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedClassroomId) {
                void (async () => {
                  setLoadingMessages(true)
                  await api
                    .get(`/classrooms/${selectedClassroomId}/messages`, { params: { page: 1, limit: 100 } })
                    .then((response) => {
                      const data = response.data?.data || []
                      const mapped: MessageItem[] = data.map((m: any) => ({
                        id: m.id,
                        content: m.content,
                        createdAt: m.createdAt,
                        userName: m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Utilisateur',
                        isOwn: m.userId === user?.id,
                      }))
                      setMessages(mapped)
                      setTimeout(scrollToBottom, 50)
                    })
                    .catch((error: any) => {
                      toast.error(error.response?.data?.message || 'Erreur lors du rafraîchissement des messages')
                    })
                  setLoadingMessages(false)
                })()
              }
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-900"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
          {t('messages.select_class_prompt')}
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-11rem)] divide-y divide-slate-100 dark:divide-slate-800">
          {loadingClasses && (
            <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{t('messages.loading_classes')}</div>
          )}
          {!loadingClasses && classrooms.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
              {t('messages.no_classes')}
            </div>
          )}
          {classrooms.map((c) => {
            const active = c.id === selectedClassroomId
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClassroomId(c.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  active
                    ? 'bg-indigo-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100'
                    : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-900 dark:text-slate-200'
                }`}
              >
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                  <AcademicCapIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {c.subject || t('classroom.default_label')} • {c.studentsCount} {t('students')}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {selectedClassroom ? selectedClassroom.name : t('messages.no_class_selected')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedClassroom
                ? `${selectedClassroom.subject || t('classroom.default_label')} • ${selectedClassroom.studentsCount} ${t('students')}`
                : t('messages.choose_left')}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm bg-slate-50/60 dark:bg-slate-950">
          {loadingMessages && (
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('messages.loading_messages')}</div>
          )}
          {!loadingMessages && messages.length === 0 && selectedClassroom && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t('messages.no_messages')}
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-3 py-2 text-xs shadow-sm ${
                  m.isOwn
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 rounded-bl-sm dark:bg-slate-900 dark:text-slate-100'
                }`}
              >
                <p className="font-semibold mb-0.5 text-[11px] opacity-80">
                  {m.isOwn ? t('me') : m.userName}
                </p>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-end gap-3">
              <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedClassroomId || sending}
              placeholder={selectedClassroomId ? t('messages.placeholder_write') : t('messages.select_first')}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              disabled={!selectedClassroomId || !input.trim() || sending}
              onClick={() => void handleSend()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages
