import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios'
import { useAuth } from './AuthContext'
import { API_URL } from './apiURL'

interface Tarefa {
  id: number,
  descricao: string,
  data_criacao: string,
  data_prevista: string,
  data_encerramento: string | null,
  situacao: string
}

interface TarefaFormData {
  descricao: string,
  data_prevista: string
}

function TarefasApp() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { logout } = useAuth()
  const userName = localStorage.getItem('userName') || 'Usuário'

  // Estados para o modal de adicionar/editar tarefa
  const [showModal, setShowModal] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [currentTarefa, setCurrentTarefa] = useState<TarefaFormData>({
    descricao: '',
    data_prevista: new Date().toISOString().split('T')[0]
  })
  const [editId, setEditId] = useState<number | null>(null)

  const formatarData = (data: string | null) => {
    if (!data) return '-'
    return new Date(data).toISOString().split('T')[0]
  }

  // Buscar tarefas
  const fetchTarefas = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_URL}/tarefas`)
      setTarefas(response.data)
    } catch (err) {
      setError('Erro ao carregar tarefas')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar tarefas ao inicializar
  useEffect(() => {
    fetchTarefas()
  }, [])

  // Abrir modal para adicionar tarefa
  const handleAddClick = () => {
    setCurrentTarefa({
      descricao: '',
      data_prevista: new Date().toISOString().split('T')[0]
    })
    setIsEditing(false)
    setShowModal(true)
  }

  // Abrir modal para editar tarefa
  const handleEditClick = (tarefa: Tarefa) => {
    setCurrentTarefa({
      descricao: tarefa.descricao,
      data_prevista: new Date(tarefa.data_prevista).toISOString().split('T')[0]
    })
    setEditId(tarefa.id)
    setIsEditing(true)
    setShowModal(true)
  }

  // Salvar tarefa (adicionar ou editar)
  const handleSaveTarefa = async () => {
    try {
      // Converter a string de data para um objeto Date
      const tarefaData = {
        ...currentTarefa,
        data_prevista: new Date(currentTarefa.data_prevista)
      }

      if (isEditing && editId) {
        // Editar tarefa existente
        await axios.put(`${API_URL}/tarefas/${editId}`, tarefaData)
      } else {
        // Adicionar nova tarefa
        await axios.post(`${API_URL}/tarefas`, tarefaData)
      }
      setShowModal(false)
      fetchTarefas() // Recarregar tarefas
    } catch (err) {
      console.error('Erro ao salvar tarefa:', err)
      alert('Erro ao salvar tarefa')
    }
  }

  // Excluir tarefa
  const handleDeleteClick = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await axios.delete(`${API_URL}/tarefas/${id}`)
        fetchTarefas() // Recarregar tarefas
      } catch (err) {
        console.error('Erro ao excluir tarefa:', err)
        alert('Erro ao excluir tarefa')
      }
    }
  }

  // Encerrar tarefa
  const handleEncerrarClick = async (id: number) => {
    try {
      await axios.put(`${API_URL}/tarefas/${id}/encerrar`)
      fetchTarefas() // Recarregar tarefas
    } catch (err) {
      console.error('Erro ao encerrar tarefa:', err)
      alert('Erro ao encerrar tarefa')
    }
  }

  // Gerar PDF
  const handleGerarPDFClick = () => {
    window.open(`${API_URL}/tarefas/relatorio/pdf`, '_blank')
  }

  // Tratar alterações no formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentTarefa(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle logout
  const handleLogout = () => {
    logout();
  }

  return (
    <div className='w-full min-h-screen p-6 flex justify-center items-center flex-col bg-gray-100'>
      <div className='w-full max-w-5xl bg-white shadow-lg rounded-lg p-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-800'>Sistema de Tarefasssssss</h1>
            <p className='text-sm text-gray-600'>Bem-vindo, {userName}</p>
          </div>
          <div className='flex gap-2'>
            <button
              onClick={handleAddClick}
              className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md'
            >
              Nova Tarefa
            </button>
            <button
              onClick={handleGerarPDFClick}
              className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md'
            >
              Gerar PDF
            </button>
            <button
              onClick={handleLogout}
              className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md'
            >
              Logout
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className='text-center py-8'>Carregando tarefas...</div>
        ) : error ? (
          <div className='text-center py-8 text-red-500'>{error}</div>
        ) : tarefas.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>Nenhuma tarefa encontrada</div>
        ) : (
          <div className='overflow-auto'>
            <table className='w-full border-collapse'>
              <thead className='bg-gray-100 text-black'>
                <tr>
                  <th className='px-4 py-2 text-left border'>Descrição</th>
                  <th className='px-4 py-2 text-left border'>Data Criação</th>
                  <th className='px-4 py-2 text-left border'>Data Prevista</th>
                  <th className='px-4 py-2 text-left border'>Data Encerramento</th>
                  <th className='px-4 py-2 text-left border'>Situação</th>
                  <th className='px-4 py-2 text-left border'>Ações</th>
                </tr>
              </thead>
              <tbody className='text-black'>
                {tarefas.map(tarefa => (
                  <tr key={tarefa.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-2 border'>{tarefa.descricao}</td>
                    <td className='px-4 py-2 border'>{formatarData(tarefa.data_criacao)}</td>
                    <td className='px-4 py-2 border'>{formatarData(tarefa.data_prevista)}</td>
                    <td className='px-4 py-2 border'>{formatarData(tarefa.data_encerramento)}</td>
                    <td className='px-4 py-2 border'>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        tarefa.situacao === 'Concluída'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tarefa.situacao}
                      </span>
                    </td>
                    <td className='px-4 py-2 border'>
                      <div className='flex gap-2'>
                        <button
                          onClick={() => handleEditClick(tarefa)}
                          className='bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded'
                          title='Editar'
                        >
                          ✏️
                        </button>
                        {tarefa.situacao !== 'Concluída' && (
                          <button
                            onClick={() => handleEncerrarClick(tarefa.id)}
                            className='bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded'
                            title='Concluir'
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(tarefa.id)}
                          className='bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded'
                          title='Excluir'
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para adicionar/editar tarefa */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center'>
          <div className='bg-white p-6 rounded-lg shadow-xl w-full max-w-md'>
            <h2 className='text-xl font-bold mb-4'>
              {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>

            <div className='mb-4'>
              <label className='block text-gray-700 mb-2'>Descrição</label>
              <input
                type='text'
                name='descricao'
                value={currentTarefa.descricao}
                onChange={handleInputChange}
                className='w-full p-2 border rounded bg-slate-300 text-black'
                required
              />
            </div>

            <div className='mb-6'>
              <label className='block text-gray-700 mb-2'>Data Prevista</label>
              <input
                type='date'
                name='data_prevista'
                value={currentTarefa.data_prevista}
                onChange={handleInputChange}
                className='w-full p-2 border rounded bg-slate-300 text-black'
                required
              />
            </div>

            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setShowModal(false)}
                className='bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded'
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTarefa}
                className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TarefasApp