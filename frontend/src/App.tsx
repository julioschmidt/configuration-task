import { useState } from 'react'
import './App.css'
import axios from 'axios'

interface Tarefa {
  id: number,
  descricao: string,
  data_criacao: string,
  data_prevista: string,
  data_encerramento: string,
  situacao: string
}

function App() {

  const formatarData = (data: string) => new Date(data).toLocaleDateString("pt-BR");

  const [tarefas, setTarefas] = useState<Tarefa[]>([])

  axios.get('http://177.44.248.67:3000').then(response => {
    setTarefas(response.data)
  }).catch(error => {
    console.error(error)
  })

  return (
    <div className='w-full h-full flex justify-center items-center flex-col'>
      <h1 className='text-3xl font-bold underline mb-10'>Sistema de Tarefas</h1>

      <table className=' border-2 border-collapse border-stone-50'>
        <thead>
          <tr>
            <th className='w-auto px-4 py-2'>Descrição</th>
            <th className='w-auto px-4 py-2'>Data Criação</th>
            <th className='w-auto px-4 py-2'>Data Prevista</th>
            <th className='w-auto px-4 py-2'>Data Encerramento</th>
            <th className='w-auto px-4 py-2'>Situação</th>
          </tr>
        </thead>
        <tbody>
          {tarefas.map(tarefa => (
            <tr key={tarefa.id}>
              <td className='w-auto px-4 py-2'>{tarefa.descricao}</td>
              <td className='w-auto px-4 py-2'>{formatarData(tarefa.data_criacao)}</td>
              <td className='w-auto px-4 py-2'>{formatarData(tarefa.data_prevista)}</td>
              <td className='w-auto px-4 py-2'>{formatarData(tarefa.data_encerramento)}</td>
              <td className='w-auto px-4 py-2'>{tarefa.situacao}</td>
            </tr>
          ))}
        </tbody>


      </table>
    </div>
  )
}

export default App