import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { useWebSocketChat } from '../hooks/useWebSocketChat'
import Sidebar from '../components/sidebar/Sidebar'
import TopBar from '../components/layout/TopBar'
import ChatWindow from '../components/chat/ChatWindow'
import {
  createConversation,
  createProject,
  deleteProjectById,
  deleteConversationById,
  fetchMessages,
  fetchModels,
  listConversations,
  listProjects,
  updateConversation,
} from '../services/api'
import { fetchMe, logout } from '../services/auth'
import { useUiStore } from '../store/uiStore'

export default function Home() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const { sendMessage, stopStreaming } = useWebSocketChat()
  const accessToken = useAuthStore(s => s.accessToken)
  const user = useAuthStore(s => s.user)

  const setModel = useChatStore(s => s.setModel)
  const setAvailableModels = useChatStore(s => s.setAvailableModels)
  const setConversations = useChatStore(s => s.setConversations)
  const setConversationMessages = useChatStore(s => s.setConversationMessages)
  const upsertConversation = useChatStore(s => s.upsertConversation)
  const deleteConversation = useChatStore(s => s.deleteConversation)
  const toggleFavorite = useChatStore(s => s.toggleFavorite)
  const setActiveId = useChatStore(s => s.setActiveId)
  const setSelectedProjectId = useChatStore(s => s.setSelectedProjectId)
  const selectedProjectId = useChatStore(s => s.selectedProjectId)
  const activeId = useChatStore(s => s.activeId)
  const conversations = useChatStore(s => s.conversations)
  const model = useChatStore(s => s.model)
  const addToast = useUiStore(s => s.addToast)

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }

    if (!user) {
      fetchMe().catch(() => logout().then(() => navigate('/login')))
    }

    fetchModels().then(list => {
      if (list.length > 0) {
        setAvailableModels(list)
        if (!model) setModel(list[0])
      }
    })

    listConversations()
      .then((rows) => {
        const mapped = rows.map((c) => ({
          id: c.id,
          title: c.title,
          model: c.model,
          projectId: c.project_id,
          favorite: c.favorite,
          archived: c.archived,
          pinned: c.pinned,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          messages: [],
        }))
        setConversations(mapped)
      })
      .catch(() => { })

    listProjects()
      .then((rows) => setProjects(rows))
      .catch(() => { })
  }, [accessToken])

  useEffect(() => {
    if (!activeId) return
    const conv = conversations.find((c) => c.id === activeId)
    if (!conv || conv.messages.length > 0) return

    fetchMessages(activeId)
      .then((rows) => {
        const messages = rows.map((m) => ({
          id: `db-${m.id}`,
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
        }))
        setConversationMessages(activeId, messages)
      })
      .catch(() => { })
  }, [activeId, conversations])

  async function handleLogout() {
    await logout()
    addToast({ type: 'info', message: 'Sessão encerrada.' })
    navigate('/login')
  }

  async function handleNewConversation() {
    try {
      const created = await createConversation({
        title: 'Nova conversa',
        project_id: selectedProjectId || null,
        model: model || null,
        favorite: false,
        archived: false,
        pinned: false,
      })
      upsertConversation({
        id: created.id,
        title: created.title,
        model: created.model,
        projectId: created.project_id,
        favorite: created.favorite,
        archived: created.archived,
        pinned: created.pinned,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        messages: [],
      })
      setActiveId(created.id)
      addToast({ type: 'success', message: 'Nova conversa criada.' })
    } catch {
      addToast({ type: 'error', message: 'Falha ao criar conversa.' })
    }
  }

  async function handleDeleteConversation(conv) {
    try {
      await deleteConversationById(conv.id)
      deleteConversation(conv.id)
      addToast({ type: 'success', message: 'Conversa movida para lixeira.' })
    } catch {
      addToast({ type: 'error', message: 'Falha ao excluir conversa.' })
    }
  }

  async function handleToggleFavorite(conv) {
    const nextFavorite = !conv.favorite
    toggleFavorite(conv.id)
    try {
      await updateConversation(conv.id, {
        title: conv.title,
        project_id: conv.projectId || null,
        model: conv.model || null,
        favorite: nextFavorite,
        archived: !!conv.archived,
        pinned: !!conv.pinned,
      })
      addToast({ type: 'success', message: nextFavorite ? 'Conversa favoritada.' : 'Favorito removido.' })
    } catch {
      toggleFavorite(conv.id)
      addToast({ type: 'error', message: 'Falha ao atualizar favorito (rollback aplicado).' })
    }
  }

  async function handleRenameConversation(conv, title) {
    const prevTitle = conv.title
    upsertConversation({ ...conv, title })
    try {
      await updateConversation(conv.id, {
        title,
        project_id: conv.projectId || null,
        model: conv.model || null,
        favorite: !!conv.favorite,
        archived: !!conv.archived,
        pinned: !!conv.pinned,
      })
      addToast({ type: 'success', message: 'Conversa renomeada.' })
    } catch {
      upsertConversation({ ...conv, title: prevTitle })
      addToast({ type: 'error', message: 'Falha ao renomear conversa (rollback aplicado).' })
    }
  }

  async function handleTogglePinned(conv) {
    const nextPinned = !conv.pinned
    upsertConversation({ ...conv, pinned: nextPinned })
    try {
      await updateConversation(conv.id, {
        title: conv.title,
        project_id: conv.projectId || null,
        model: conv.model || null,
        favorite: !!conv.favorite,
        archived: !!conv.archived,
        pinned: nextPinned,
      })
      addToast({ type: 'success', message: nextPinned ? 'Conversa fixada.' : 'Conversa desafixada.' })
    } catch {
      upsertConversation({ ...conv, pinned: !nextPinned })
      addToast({ type: 'error', message: 'Falha ao fixar/desafixar (rollback aplicado).' })
    }
  }

  async function handleToggleArchived(conv) {
    const nextArchived = !conv.archived
    upsertConversation({ ...conv, archived: nextArchived })
    try {
      await updateConversation(conv.id, {
        title: conv.title,
        project_id: conv.projectId || null,
        model: conv.model || null,
        favorite: !!conv.favorite,
        archived: nextArchived,
        pinned: !!conv.pinned,
      })
      addToast({ type: 'success', message: nextArchived ? 'Conversa arquivada.' : 'Conversa desarquivada.' })
    } catch {
      upsertConversation({ ...conv, archived: !nextArchived })
      addToast({ type: 'error', message: 'Falha ao arquivar/desarquivar (rollback aplicado).' })
    }
  }

  async function handleCreateProject(name) {
    try {
      const created = await createProject({ name, description: null })
      setProjects((prev) => [...prev, created])
      setSelectedProjectId(created.id)
      addToast({ type: 'success', message: 'Projeto criado.' })
    } catch {
      addToast({ type: 'error', message: 'Falha ao criar projeto.' })
    }
  }

  async function handleDeleteProject(project) {
    try {
      await deleteProjectById(project.id)
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
      if (selectedProjectId === project.id) {
        setSelectedProjectId(null)
      }
      addToast({ type: 'success', message: 'Projeto excluído.' })
    } catch {
      addToast({ type: 'error', message: 'Falha ao excluir projeto.' })
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg)]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        onToggleFavorite={handleToggleFavorite}
        onRenameConversation={handleRenameConversation}
        onTogglePinned={handleTogglePinned}
        onToggleArchived={handleToggleArchived}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} />
        <ChatWindow onSend={sendMessage} onStop={stopStreaming} />
      </div>
    </div>
  )
}
