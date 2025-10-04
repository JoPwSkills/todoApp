import React, { useState, useMemo, useEffect } from 'react';
import { Todo } from '../types/todo';
import TodoItem from './TodoItem';
import { exportToCSV } from '../utils/csvExport';
import '../styles/TodoList.css';

const STORAGE_KEY = 'todos-data';

const saveTodosToStorage = (todos: Todo[]) => {
  const todosJson = JSON.stringify(todos);
  localStorage.setItem(STORAGE_KEY, todosJson);
};

const loadTodosFromStorage = (): Todo[] => {
  const storedTodos = localStorage.getItem(STORAGE_KEY);
  if (storedTodos) {
    try {
      const parsedTodos = JSON.parse(storedTodos);
      // Convert string dates back to Date objects
      return parsedTodos.map((todo: any) => ({
        ...todo,
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
      }));
    } catch (e) {
      console.error('Error parsing stored todos:', e);
      return [];
    }
  }
  return [];
};

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(loadTodosFromStorage());
  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState<string>('');

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const newTodo: Todo = {
        id: Date.now(),
        text: input.trim(),
        completed: false,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      };
      setTodos([...todos, newTodo]);
      setInput('');
      setDueDate('');
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // Save todos whenever they change
  useEffect(() => {
    saveTodosToStorage(todos);
  }, [todos]);

  const { activeTodos, overdueTodos } = useMemo(() => {
    const now = new Date();
    return todos.reduce(
      (acc, todo) => {
        if (!todo.dueDate || todo.completed) {
          acc.activeTodos.push(todo);
        } else {
          const dueDate = new Date(todo.dueDate);
          if (dueDate < now) {
            acc.overdueTodos.push(todo);
          } else {
            acc.activeTodos.push(todo);
          }
        }
        return acc;
      },
      { activeTodos: [] as Todo[], overdueTodos: [] as Todo[] }
    );
  }, [todos]);

  const handleExport = () => {
    const exportableTodos = [...activeTodos, ...overdueTodos];
    const csvContent = [
      // CSV Headers
      ['Task', 'Status', 'Due Date', 'Is Overdue'].join(','),
      // CSV Data
      ...exportableTodos.map(todo => {
        const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
        const now = new Date();
        const isOverdue = dueDate ? dueDate < now && !todo.completed : false;
        
        return [
          `"${todo.text}"`,
          todo.completed ? 'Completed' : 'Pending',
          dueDate ? dueDate.toLocaleString() : 'No due date',
          isOverdue ? 'Yes' : 'No'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `todo-list-${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleJsonExport = () => {
    const todosJson = JSON.stringify(todos, null, 2); // Pretty print JSON
    const blob = new Blob([todosJson], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `todos-backup-${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="todo-container">
      <div className="todo-header">
        <h1 className="todo-title">Todo List</h1>
        <div className="export-buttons">
          <button 
            onClick={handleExport} 
            className="export-button"
            title="Export to CSV"
          >
            Export to CSV
          </button>
          <button 
            onClick={handleJsonExport} 
            className="export-button"
            title="Download JSON backup"
          >
            Download JSON
          </button>
        </div>
      </div>
      <form onSubmit={handleAddTodo} className="todo-form">
        <div className="input-group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a new todo"
            className="todo-input"
          />
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="date-input"
          />
        </div>
        <button type="submit" className="todo-button">Add</button>
      </form>
      
      <div className="todo-section">
        <h2 className="section-title">Active Todos</h2>
        {activeTodos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        ))}
      </div>

      {overdueTodos.length > 0 && (
        <div className="todo-section overdue">
          <h2 className="section-title">Overdue Todos</h2>
          {overdueTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoList;